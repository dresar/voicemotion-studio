package middleware

import (
	"time"

	"github.com/labstack/echo/v4"
	echomiddleware "github.com/labstack/echo/v4/middleware"
)

func CORS(origins []string) echo.MiddlewareFunc {
	configuration := echomiddleware.DefaultCORSConfig
	configuration.AllowOrigins = origins
	configuration.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	configuration.AllowHeaders = []string{"Authorization", "Content-Type", "X-Requested-With"}
	configuration.ExposeHeaders = []string{"Content-Length"}
	configuration.AllowCredentials = false
	configuration.MaxAge = int((10 * time.Minute).Seconds())
	return echomiddleware.CORSWithConfig(configuration)
}
