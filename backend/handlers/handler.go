package handlers

import (
	"database/sql"

	"voicemotion/config"
	"voicemotion/models"
)

type Handler struct {
	DB     *sql.DB
	Config config.Config
	Styles []models.StylePack
}

func New(connection *sql.DB, cfg config.Config, styles []models.StylePack) *Handler {
	return &Handler{DB: connection, Config: cfg, Styles: styles}
}
