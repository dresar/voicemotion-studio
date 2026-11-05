package middleware

import (
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/labstack/echo/v4"
)

type rateEntry struct {
	count int
	reset time.Time
}

func RateLimit(limit int, window time.Duration) echo.MiddlewareFunc {
	var mutex sync.Mutex
	entries := make(map[string]*rateEntry)
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			key := UserID(c)
			if key == "" {
				key = c.RealIP()
			}
			now := time.Now()
			mutex.Lock()
			entry, exists := entries[key]
			if !exists || now.After(entry.reset) {
				entry = &rateEntry{count: 0, reset: now.Add(window)}
				entries[key] = entry
			}
			entry.count++
			allowed := entry.count <= limit
			retryAfter := int(time.Until(entry.reset).Seconds())
			if len(entries) > 5000 {
				for entryKey, entryValue := range entries {
					if now.After(entryValue.reset) {
						delete(entries, entryKey)
					}
				}
			}
			mutex.Unlock()
			if !allowed {
				if retryAfter < 1 {
					retryAfter = 1
				}
				c.Response().Header().Set("Retry-After", strconv.Itoa(retryAfter))
				return c.JSON(http.StatusTooManyRequests, map[string]string{"error": "Terlalu banyak permintaan. Coba lagi sebentar."})
			}
			return next(c)
		}
	}
}
