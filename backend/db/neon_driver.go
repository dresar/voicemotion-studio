package db

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"strconv"
	"strings"

	"github.com/lib/pq"
)

type neonDriver struct {
	parent pq.Driver
}

func init() {
	sql.Register("neonsql", &neonDriver{})
}

func (d *neonDriver) Open(name string) (driver.Conn, error) {
	conn, err := d.parent.Open(name)
	if err != nil {
		return nil, err
	}
	return &neonConn{conn: conn}, nil
}

type neonConn struct {
	conn driver.Conn
}

func (c *neonConn) Close() error {
	return c.conn.Close()
}

func (c *neonConn) Begin() (driver.Tx, error) {
	return c.conn.Begin()
}

func (c *neonConn) Ping(ctx context.Context) error {
	if pinger, ok := c.conn.(driver.Pinger); ok {
		return pinger.Ping(ctx)
	}
	return nil
}

func (c *neonConn) BeginTx(ctx context.Context, opts driver.TxOptions) (driver.Tx, error) {
	if connBeginTx, ok := c.conn.(driver.ConnBeginTx); ok {
		return connBeginTx.BeginTx(ctx, opts)
	}
	return c.conn.Begin()
}

func (c *neonConn) Prepare(query string) (driver.Stmt, error) {
	return c.conn.Prepare(rebind(query))
}

func (c *neonConn) PrepareContext(ctx context.Context, query string) (driver.Stmt, error) {
	if preparer, ok := c.conn.(driver.ConnPrepareContext); ok {
		return preparer.PrepareContext(ctx, rebind(query))
	}
	return c.Prepare(query)
}

func (c *neonConn) Exec(query string, args []driver.Value) (driver.Result, error) {
	if execer, ok := c.conn.(driver.Execer); ok {
		return execer.Exec(rebind(query), args)
	}
	stmt, err := c.Prepare(query)
	if err != nil {
		return nil, err
	}
	defer stmt.Close()
	return stmt.Exec(args)
}

func (c *neonConn) ExecContext(ctx context.Context, query string, args []driver.NamedValue) (driver.Result, error) {
	reb := rebind(query)
	if execer, ok := c.conn.(driver.ExecerContext); ok {
		return execer.ExecContext(ctx, reb, args)
	}
	dargs := make([]driver.Value, len(args))
	for i, nv := range args {
		dargs[i] = nv.Value
	}
	return c.Exec(query, dargs)
}

func (c *neonConn) Query(query string, args []driver.Value) (driver.Rows, error) {
	if queryer, ok := c.conn.(driver.Queryer); ok {
		return queryer.Query(rebind(query), args)
	}
	stmt, err := c.Prepare(query)
	if err != nil {
		return nil, err
	}
	defer stmt.Close()
	return stmt.Query(args)
}

func (c *neonConn) QueryContext(ctx context.Context, query string, args []driver.NamedValue) (driver.Rows, error) {
	reb := rebind(query)
	if queryer, ok := c.conn.(driver.QueryerContext); ok {
		return queryer.QueryContext(ctx, reb, args)
	}
	dargs := make([]driver.Value, len(args))
	for i, nv := range args {
		dargs[i] = nv.Value
	}
	return c.Query(query, dargs)
}

func rebind(query string) string {
	var b strings.Builder
	b.Grow(len(query) + 16)
	param := 1
	inString := false
	for i := 0; i < len(query); i++ {
		char := query[i]
		if char == '\'' {
			inString = !inString
			b.WriteByte(char)
		} else if char == '?' && !inString {
			b.WriteByte('$')
			b.WriteString(strconv.Itoa(param))
			param++
		} else {
			b.WriteByte(char)
		}
	}
	return b.String()
}
