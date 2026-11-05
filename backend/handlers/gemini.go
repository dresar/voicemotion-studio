package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"sync/atomic"
	"time"

	"github.com/labstack/echo/v4"
)

var geminiKeyIndex uint64

type suggestTopicsRequest struct {
	Category string `json:"category"`
	Language string `json:"language"`
	Hint     string `json:"hint"`
}

type geminiPart struct {
	Text string `json:"text"`
}

type geminiContent struct {
	Parts []geminiPart `json:"parts"`
}

type geminiRequest struct {
	Contents []geminiContent `json:"contents"`
}

type geminiCandidate struct {
	Content struct {
		Parts []struct {
			Text string `json:"text"`
		} `json:"parts"`
	} `json:"content"`
}

type geminiResponse struct {
	Candidates []geminiCandidate `json:"candidates"`
}

func (h *Handler) SuggestTopics(c echo.Context) error {
	var req suggestTopicsRequest
	if err := c.Bind(&req); err != nil {
		req.Category = "motivation"
		req.Language = "id"
	}

	keys := h.Config.GeminiAPIKeys
	if len(keys) == 0 {
		return c.JSON(http.StatusOK, map[string]any{
			"topics": []string{
				"Disiplin Mengalahkan Bakat",
				"Satu Langkah Kecil Setiap Hari",
				"Kalahkan Penundaan Sebelum Memulai",
				"Fokus Pada Proses Bukan Hasil",
			},
		})
	}

	categoryName := req.Category
	if categoryName == "" {
		categoryName = "motivasi"
	}
	lang := "Bahasa Indonesia"
	if req.Language == "en" {
		lang = "English"
	}

	prompt := fmt.Sprintf(
		"Berikan 5 ide topik video pendek yang sangat viral, menarik, dan bikin penasaran untuk kategori '%s' dalam %s. Topik harus ringkas (3-6 kata per judul). Jawab HANYA dalam format JSON array of string murni tanpa markdown, contoh: [\"Judul 1\", \"Judul 2\", \"Judul 3\", \"Judul 4\", \"Judul 5\"].",
		categoryName, lang,
	)
	if req.Hint != "" {
		prompt += fmt.Sprintf(" Referensi tema/kata kunci pengguna: '%s'.", req.Hint)
	}

	settings := h.loadSystemSettings()
	if settings.AIRouter.ActiveProvider == "bynara" || settings.AIRouter.ActiveProvider == "sumopod" || settings.AIRouter.ActiveProvider == "custom" {
		var baseURL, apiKey, model string
		switch settings.AIRouter.ActiveProvider {
		case "sumopod":
			baseURL = settings.AIRouter.Sumopod.BaseURL
			apiKey = settings.AIRouter.Sumopod.APIKey
			model = settings.AIRouter.TaskRouting.TopicsModel
			if model == "" {
				model = settings.AIRouter.Sumopod.DefaultModel
			}
		case "custom":
			baseURL = settings.AIRouter.Custom.BaseURL
			apiKey = settings.AIRouter.Custom.APIKey
			model = settings.AIRouter.Custom.DefaultModel
		default: // bynara
			baseURL = settings.AIRouter.ByNara.BaseURL
			apiKey = settings.AIRouter.ByNara.APIKey
			model = settings.AIRouter.TaskRouting.TopicsModel
			if model == "" {
				model = settings.AIRouter.ByNara.DefaultModel
			}
		}

		if baseURL != "" {
			topics, err := fetchTopicsFromOpenAI(c.Request().Context(), baseURL, apiKey, model, prompt)
			if err == nil && len(topics) > 0 {
				return c.JSON(http.StatusOK, map[string]any{
					"topics":   topics,
					"model":    model,
					"provider": settings.AIRouter.ActiveProvider,
				})
			}
		}
	}

	payloadObj := geminiRequest{
		Contents: []geminiContent{
			{
				Parts: []geminiPart{
					{Text: prompt},
				},
			},
		},
	}
	payloadBytes, _ := json.Marshal(payloadObj)

	client := &http.Client{Timeout: 12 * time.Second}
	startIndex := atomic.AddUint64(&geminiKeyIndex, 1)

	var lastErr error
	for i := 0; i < len(keys); i++ {
		key := strings.TrimSpace(keys[(int(startIndex)+i)%len(keys)])
		if key == "" {
			continue
		}

		apiURL := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=%s", key)
		httpReq, err := http.NewRequestWithContext(c.Request().Context(), "POST", apiURL, bytes.NewReader(payloadBytes))
		if err != nil {
			lastErr = err
			continue
		}
		httpReq.Header.Set("Content-Type", "application/json")

		resp, err := client.Do(httpReq)
		if err != nil {
			lastErr = err
			continue
		}
		respBody, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			lastErr = fmt.Errorf("gemini status %d: %s", resp.StatusCode, string(respBody))
			continue
		}

		var geminiResp geminiResponse
		if err := json.Unmarshal(respBody, &geminiResp); err != nil {
			lastErr = err
			continue
		}

		if len(geminiResp.Candidates) > 0 && len(geminiResp.Candidates[0].Content.Parts) > 0 {
			text := geminiResp.Candidates[0].Content.Parts[0].Text
			topics := parseTopicsFromText(text)
			if len(topics) > 0 {
				return c.JSON(http.StatusOK, map[string]any{
					"topics": topics,
					"model":  "gemini-3.5-flash-lite",
				})
			}
		}
	}

	// Fallback jika API key bermasalah
	fallbackTopics := []string{
		"Disiplin Mengalahkan Bakat",
		"Satu Langkah Kecil Hari Ini",
		"Kunci Fokus di Era Distraksi",
		"Rahasia Bangkit dari Kegagalan",
		"Membangun Kebiasaan Menang",
	}
	return c.JSON(http.StatusOK, map[string]any{
		"topics": fallbackTopics,
		"notice": fmt.Sprintf("Fallback generated: %v", lastErr),
	})
}

var arrayPattern = regexp.MustCompile(`\[[\s\S]*\]`)

func parseTopicsFromText(text string) []string {
	clean := strings.TrimSpace(text)
	match := arrayPattern.FindString(clean)
	if match != "" {
		var list []string
		if err := json.Unmarshal([]byte(match), &list); err == nil && len(list) > 0 {
			return list
		}
	}

	lines := strings.Split(clean, "\n")
	var result []string
	for _, line := range lines {
		l := strings.TrimSpace(line)
		l = strings.TrimLeft(l, "*-0123456789. •\"'")
		l = strings.TrimRight(l, "\"'")
		l = strings.TrimSpace(l)
		if len(l) > 2 && len(l) < 80 {
			result = append(result, l)
			if len(result) >= 5 {
				break
			}
		}
	}
	return result
}

func fetchTopicsFromOpenAI(ctx context.Context, baseURL, apiKey, model, prompt string) ([]string, error) {
	targetURL := strings.TrimRight(baseURL, "/") + "/chat/completions"
	payload := map[string]any{
		"model": model,
		"messages": []map[string]string{
			{"role": "user", "content": prompt},
		},
		"temperature": 0.7,
		"max_tokens":  300,
	}
	data, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, targetURL, bytes.NewBuffer(data))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	if apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+apiKey)
	}

	client := &http.Client{Timeout: 12 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("status code %d", resp.StatusCode)
	}

	var chatRes struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&chatRes); err != nil {
		return nil, err
	}

	if len(chatRes.Choices) == 0 {
		return nil, fmt.Errorf("empty choices")
	}

	topics := parseTopicsFromText(chatRes.Choices[0].Message.Content)
	if len(topics) == 0 {
		return nil, fmt.Errorf("could not parse topics")
	}
	return topics, nil
}
