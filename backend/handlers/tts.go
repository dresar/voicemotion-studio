package handlers

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v4"

	"voicemotion/models"
)

var audioFilenamePattern = regexp.MustCompile(`^[a-f0-9]{64}\.mp3$`)

var availableVoices = []models.Voice{
	{ID: "ibu_sari", Name: "Ibu Sari (Gemini Natural)", Gender: "female", EdgeVoice: "id-ID-GadisNeural", Description: "AI Voice Perempuan, hangat & natural"},
	{ID: "bapak_ardi", Name: "Bapak Ardi (Gemini Pro)", Gender: "male", EdgeVoice: "id-ID-ArdiNeural", Description: "AI Voice Laki-laki, tegas & profesional"},
}

type synthesizeRequest struct {
	Text    string  `json:"text"`
	VoiceID string  `json:"voiceId"`
	Speed   float64 `json:"speed"`
}

type googleTTSRequest struct {
	Input struct {
		Text string `json:"text"`
	} `json:"input"`
	Voice struct {
		LanguageCode string `json:"languageCode"`
		Name         string `json:"name"`
	} `json:"voice"`
	AudioConfig struct {
		AudioEncoding string `json:"audioEncoding"`
	} `json:"audioConfig"`
}

type googleTTSResponse struct {
	AudioContent string `json:"audioContent"`
}

func (h *Handler) ListVoices(c echo.Context) error {
	return c.JSON(http.StatusOK, availableVoices)
}

func (h *Handler) Synthesize(c echo.Context) error {
	var payload synthesizeRequest
	if err := bindJSON(c, &payload); err != nil {
		return err
	}
	text := strings.TrimSpace(payload.Text)
	if text == "" {
		return writeError(c, http.StatusBadRequest, "Teks suara wajib diisi.")
	}
	if len([]rune(text)) > 5000 {
		return writeError(c, http.StatusBadRequest, "Teks suara maksimal 5000 karakter.")
	}
	voice, exists := findVoice(payload.VoiceID)
	if !exists {
		return writeError(c, http.StatusBadRequest, "Suara tidak dikenali.")
	}
	speed := payload.Speed
	if speed == 0 {
		speed = 1
	}
	if speed < 0.8 {
		speed = 0.8
	}
	if speed > 1.3 {
		speed = 1.3
	}
	hash := sha256.Sum256([]byte(voice.ID + "|" + fmt.Sprintf("%.2f", speed) + "|" + text))
	filename := hex.EncodeToString(hash[:]) + ".mp3"
	directory := filepath.Join(h.Config.UploadDir, "tts")
	if err := os.MkdirAll(directory, 0o755); err != nil {
		return writeError(c, http.StatusInternalServerError, "Folder audio tidak bisa dibuat.")
	}
	outputPath := filepath.Join(directory, filename)
	if info, err := os.Stat(outputPath); err == nil && info.Size() > 0 {
		return c.JSON(http.StatusOK, map[string]any{"url": "/api/tts/audio/" + filename, "filename": filename, "cached": true})
	}
	timeoutSeconds := h.Config.TTSTimeoutSeconds
	if timeoutSeconds <= 0 {
		timeoutSeconds = 30
	}
	ctx, cancel := context.WithTimeout(c.Request().Context(), time.Duration(timeoutSeconds)*time.Second)
	defer cancel()
	edgeErr := h.runEdgeTTS(ctx, voice.EdgeVoice, text, speed, outputPath)
	if edgeErr != nil {
		c.Logger().Warnf("edge-tts gagal: %v", edgeErr)
		if h.Config.GoogleTTSAPIKey != "" {
			if googleErr := h.runGoogleTTS(ctx, voice, text, outputPath); googleErr != nil {
				c.Logger().Errorf("google tts gagal: %v", googleErr)
				return writeError(c, http.StatusBadGateway, "Suara belum bisa dibuat. Pastikan edge-tts atau Google TTS aktif di server.")
			}
		} else {
			return writeError(c, http.StatusBadGateway, "Suara belum bisa dibuat. Pastikan edge-tts atau Google TTS aktif di server.")
		}
	}
	info, err := os.Stat(outputPath)
	if err != nil || info.Size() == 0 {
		return writeError(c, http.StatusBadGateway, "Audio tidak dihasilkan. Coba lagi.")
	}
	return c.JSON(http.StatusOK, map[string]any{"url": "/api/tts/audio/" + filename, "filename": filename, "cached": false})
}

func (h *Handler) ServeAudio(c echo.Context) error {
	filename := c.Param("filename")
	if !audioFilenamePattern.MatchString(filename) {
		return writeError(c, http.StatusNotFound, "Audio tidak ditemukan.")
	}
	filePath := filepath.Join(h.Config.UploadDir, "tts", filename)
	if _, err := os.Stat(filePath); err != nil {
		return writeError(c, http.StatusNotFound, "Audio tidak ditemukan.")
	}
	c.Response().Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	return c.File(filePath)
}

func (h *Handler) runEdgeTTS(ctx context.Context, edgeVoice string, text string, speed float64, outputPath string) error {
	parts := strings.Fields(h.Config.EdgeTTSCmd)
	if len(parts) == 0 {
		return fmt.Errorf("perintah edge-tts kosong")
	}
	args := append([]string{}, parts[1:]...)
	args = append(args, "--voice", edgeVoice, "--text", text, "--rate", formatRate(speed), "--write-media", outputPath)
	command := exec.CommandContext(ctx, parts[0], args...)
	var stderr bytes.Buffer
	command.Stderr = &stderr
	if err := command.Run(); err != nil {
		detail := strings.TrimSpace(stderr.String())
		if detail != "" {
			return fmt.Errorf("%w: %s", err, detail)
		}
		return err
	}
	return nil
}

func (h *Handler) runGoogleTTS(ctx context.Context, voice models.Voice, text string, outputPath string) error {
	payload := googleTTSRequest{}
	payload.Input.Text = text
	payload.Voice.LanguageCode = "id-ID"
	if voice.Gender == "male" {
		payload.Voice.Name = "id-ID-Standard-B"
	} else {
		payload.Voice.Name = "id-ID-Standard-A"
	}
	payload.AudioConfig.AudioEncoding = "MP3"
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	endpoint := "https://texttospeech.googleapis.com/v1/text:synthesize?key=" + url.QueryEscape(h.Config.GoogleTTSAPIKey)
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return err
	}
	request.Header.Set("Content-Type", "application/json")
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		detail, _ := io.ReadAll(io.LimitReader(response.Body, 2048))
		return fmt.Errorf("google tts status %d: %s", response.StatusCode, strings.TrimSpace(string(detail)))
	}
	var result googleTTSResponse
	if err := json.NewDecoder(io.LimitReader(response.Body, 10<<20)).Decode(&result); err != nil {
		return err
	}
	audio, err := base64.StdEncoding.DecodeString(result.AudioContent)
	if err != nil {
		return err
	}
	if len(audio) == 0 {
		return fmt.Errorf("google tts mengembalikan audio kosong")
	}
	return os.WriteFile(outputPath, audio, 0o644)
}

func findVoice(voiceID string) (models.Voice, bool) {
	for _, voice := range availableVoices {
		if voice.ID == voiceID {
			return voice, true
		}
	}
	return models.Voice{}, false
}

func formatRate(speed float64) string {
	percent := int(math.Round((speed - 1) * 100))
	if percent >= 0 {
		return "+" + strconv.Itoa(percent) + "%"
	}
	return strconv.Itoa(percent) + "%"
}
