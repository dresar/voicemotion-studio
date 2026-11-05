package models

import (
	"encoding/json"

	"github.com/golang-jwt/jwt/v5"
)

type User struct {
	ID           string  `json:"id"`
	Email        string  `json:"email"`
	Name         string  `json:"name"`
	Avatar       string  `json:"avatar"`
	Provider     string  `json:"provider"`
	Plan         string  `json:"plan"`
	TrialEndsAt  *string `json:"trialEndsAt"`
	Credits      int     `json:"credits"`
	ProjectQuota int     `json:"projectQuota"`
	Role         string  `json:"role"`
	ReferralCode string  `json:"referralCode"`
	CreatedAt    string  `json:"createdAt"`
	Disabled     bool    `json:"disabled"`
	PasswordHash string  `json:"-"`
}

type Project struct {
	ID             string          `json:"id"`
	UserID         string          `json:"userId"`
	Title          string          `json:"title"`
	Stage          string          `json:"stage"`
	Config         json.RawMessage `json:"config"`
	SelectedIdeaID *string         `json:"selectedIdeaId"`
	SelectedIdea   json.RawMessage `json:"selectedIdea"`
	SceneCount     int             `json:"sceneCount"`
	TotalDuration  float64         `json:"totalDuration"`
	CreatedAt      string          `json:"createdAt"`
	UpdatedAt      string          `json:"updatedAt"`
}

type Scene struct {
	ID          string  `json:"id"`
	ProjectID   string  `json:"projectId,omitempty"`
	Idx         int     `json:"idx"`
	Narration   string  `json:"narration"`
	Visual      string  `json:"visual"`
	Theme       string  `json:"theme"`
	DurationSec float64 `json:"durationSec"`
	AudioPath   *string `json:"audioPath"`
	AudioMs     *int    `json:"audioMs"`
	WordTimings *string `json:"wordTimings"`
	Code        string  `json:"code"`
	CodeStatus  string  `json:"codeStatus"`
	CodeError   *string `json:"codeError"`
	UpdatedAt   string  `json:"updatedAt,omitempty"`
}

type StylePack struct {
	Slug                 string   `json:"slug"`
	Name                 string   `json:"name"`
	Category             string   `json:"category"`
	Theme                string   `json:"theme"`
	Palette              []string `json:"palette"`
	Finishing            string   `json:"finishing"`
	DescriptionForPrompt string   `json:"descriptionForPrompt"`
	SampleCode           string   `json:"sampleCode"`
	Heavy                bool     `json:"heavy"`
	Transitions          []string `json:"transitions"`
}

type Voice struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Gender      string `json:"gender"`
	EdgeVoice   string `json:"edgeVoice"`
	Description string `json:"description"`
}

type AdminUser struct {
	User
	ProjectCount int `json:"projectCount"`
}

type AdminOverviewStats struct {
	UsersCount      int   `json:"usersCount"`
	ProjectsCount   int   `json:"projectsCount"`
	ScenesCount     int   `json:"scenesCount"`
	ExportsCount    int   `json:"exportsCount"`
	AudioFilesCount int   `json:"audioFilesCount"`
	StorageBytes    int64 `json:"storageBytes"`
}

type AdminAssetItem struct {
	Filename     string `json:"filename"`
	SizeBytes    int64  `json:"sizeBytes"`
	UpdatedAt    string `json:"updatedAt"`
	IsReferenced bool   `json:"isReferenced"`
	URL          string `json:"url"`
}

type AdminProjectItem struct {
	ID         string `json:"id"`
	UserID     string `json:"userId"`
	UserEmail  string `json:"userEmail"`
	Title      string `json:"title"`
	Stage      string `json:"stage"`
	SceneCount int    `json:"sceneCount"`
	CreatedAt  string `json:"createdAt"`
	UpdatedAt  string `json:"updatedAt"`
}

type AdminLedgerItem struct {
	ID        string `json:"id"`
	UserID    string `json:"userId"`
	UserEmail string `json:"userEmail"`
	Delta     int    `json:"delta"`
	Reason    string `json:"reason"`
	Ref       string `json:"ref"`
	CreatedAt string `json:"createdAt"`
}

type ExportLog struct {
	ID        string `json:"id"`
	ProjectID string `json:"projectId"`
	UserID    string `json:"userId"`
	Status    string `json:"status"`
	Format    string `json:"format"`
	SizeBytes int64  `json:"sizeBytes"`
	CreatedAt string `json:"createdAt"`
}

type ByNaraConfig struct {
	Enabled      bool     `json:"enabled"`
	BaseURL      string   `json:"baseUrl"`
	APIKey       string   `json:"apiKey"`
	SecondaryKey string   `json:"secondaryKey"`
	DefaultModel string   `json:"defaultModel"`
	Models       []string `json:"models"`
}

type SumopodConfig struct {
	Enabled      bool   `json:"enabled"`
	BaseURL      string `json:"baseUrl"`
	APIKey       string `json:"apiKey"`
	DefaultModel string `json:"defaultModel"`
}

type GeminiConfig struct {
	Enabled      bool     `json:"enabled"`
	APIKeys      []string `json:"apiKeys"`
	DefaultModel string   `json:"defaultModel"`
}

type CustomAIConfig struct {
	Enabled      bool   `json:"enabled"`
	BaseURL      string `json:"baseUrl"`
	APIKey       string `json:"apiKey"`
	DefaultModel string `json:"defaultModel"`
}

type TaskRoutingConfig struct {
	TopicsModel    string `json:"topicsModel"`
	ScriptModel    string `json:"scriptModel"`
	AnimationModel string `json:"animationModel"`
	VoiceModel     string `json:"voiceModel"`
}

type AIRouterSettings struct {
	ActiveProvider string            `json:"activeProvider"`
	FallbackAuto   bool              `json:"fallbackAuto"`
	Temperature    float64           `json:"temperature"`
	TopP           float64           `json:"topP"`
	MaxTokens      int               `json:"maxTokens"`
	SystemPrompt   string            `json:"systemPrompt"`
	ByNara         ByNaraConfig      `json:"bynara"`
	Sumopod        SumopodConfig     `json:"sumopod"`
	Gemini         GeminiConfig      `json:"gemini"`
	Custom         CustomAIConfig    `json:"custom"`
	TaskRouting    TaskRoutingConfig `json:"taskRouting"`
}

type PlatformSettings struct {
	TTSEngine          string `json:"ttsEngine"`
	DefaultVoice       string `json:"defaultVoice"`
	TTSTimeoutSeconds  int    `json:"ttsTimeoutSeconds"`
	TrialDays          int    `json:"trialDays"`
	TrialCredits       int    `json:"trialCredits"`
	TrialQuota         int    `json:"trialQuota"`
	StarterCredits     int    `json:"starterCredits"`
	ProCredits         int    `json:"proCredits"`
	AutoCleanupOrphan  bool   `json:"autoCleanupOrphan"`
	JWTExpiryHours     int    `json:"jwtExpiryHours"`
	MaintenanceMode    bool   `json:"maintenanceMode"`
	GoogleClientID     string `json:"googleClientId"`
	GoogleClientSecret string `json:"googleClientSecret"`
}

type SystemSettingsPayload struct {
	AIRouter AIRouterSettings `json:"aiRouter"`
	Platform PlatformSettings `json:"platform"`
}

type AITestRequest struct {
	Provider string `json:"provider"`
	Model    string `json:"model"`
	Prompt   string `json:"prompt"`
	BaseURL  string `json:"baseUrl"`
	APIKey   string `json:"apiKey"`
}

type AITestResponse struct {
	OK        bool   `json:"ok"`
	Reply     string `json:"reply,omitempty"`
	LatencyMs int64  `json:"latencyMs"`
	Provider  string `json:"provider"`
	Model     string `json:"model"`
	Error     string `json:"error,omitempty"`
}

type Claims struct {
	UserID string `json:"uid"`
	Role   string `json:"role"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}
