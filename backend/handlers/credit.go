package handlers

import (
	"database/sql"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"voicemotion/middleware"
)

type spendCreditRequest struct {
	Amount int    `json:"amount"`
	Reason string `json:"reason"`
	Ref    string `json:"ref"`
}

func (h *Handler) CreditBalance(c echo.Context) error {
	var credits int
	if err := h.DB.QueryRow("SELECT credits FROM users WHERE id = ?", middleware.UserID(c)).Scan(&credits); err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal memuat kredit.")
	}
	return c.JSON(http.StatusOK, map[string]int{"credits": credits})
}

func (h *Handler) SpendCredit(c echo.Context) error {
	userID := middleware.UserID(c)
	var payload spendCreditRequest
	if err := bindJSON(c, &payload); err != nil {
		return err
	}
	if payload.Amount < 1 || payload.Amount > 100 {
		return writeError(c, http.StatusBadRequest, "Jumlah kredit tidak valid.")
	}
	ref := strings.TrimSpace(payload.Ref)
	if ref == "" || len([]rune(ref)) > 120 {
		return writeError(c, http.StatusBadRequest, "Referensi kredit wajib diisi.")
	}
	reason := strings.TrimSpace(payload.Reason)
	if reason == "" {
		reason = "export"
	}
	transaction, err := h.DB.Begin()
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal memproses kredit.")
	}
	defer transaction.Rollback()
	var existingID string
	err = transaction.QueryRow("SELECT id FROM credit_ledger WHERE user_id = ? AND ref = ?", userID, ref).Scan(&existingID)
	if err == nil {
		var credits int
		if err := transaction.QueryRow("SELECT credits FROM users WHERE id = ?", userID).Scan(&credits); err != nil {
			return writeError(c, http.StatusInternalServerError, "Gagal memuat kredit.")
		}
		transaction.Commit()
		return c.JSON(http.StatusOK, map[string]int{"credits": credits})
	}
	if err != sql.ErrNoRows {
		return writeError(c, http.StatusInternalServerError, "Gagal memeriksa kredit.")
	}
	result, err := transaction.Exec("UPDATE users SET credits = credits - ? WHERE id = ? AND credits >= ?", payload.Amount, userID, payload.Amount)
	if err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal memproses kredit.")
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		return writeError(c, http.StatusPaymentRequired, "Kredit tidak cukup untuk export.")
	}
	_, err = transaction.Exec(
		"INSERT INTO credit_ledger (id, user_id, delta, reason, ref, created_at) VALUES (?, ?, ?, ?, ?, ?)",
		uuid.NewString(),
		userID,
		-payload.Amount,
		reason,
		ref,
		nowRFC3339(),
	)
	if err != nil {
		if isUniqueViolation(err) {
			transaction.Rollback()
			var credits int
			if queryErr := h.DB.QueryRow("SELECT credits FROM users WHERE id = ?", userID).Scan(&credits); queryErr != nil {
				return writeError(c, http.StatusInternalServerError, "Gagal memuat kredit.")
			}
			return c.JSON(http.StatusOK, map[string]int{"credits": credits})
		}
		return writeError(c, http.StatusInternalServerError, "Gagal mencatat kredit.")
	}
	if err := transaction.Commit(); err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal menyelesaikan kredit.")
	}
	var credits int
	if err := h.DB.QueryRow("SELECT credits FROM users WHERE id = ?", userID).Scan(&credits); err != nil {
		return writeError(c, http.StatusInternalServerError, "Gagal memuat kredit.")
	}
	return c.JSON(http.StatusOK, map[string]int{"credits": credits})
}
