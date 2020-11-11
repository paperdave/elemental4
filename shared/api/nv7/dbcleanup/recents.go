package main

import (
	"context"

	database "firebase.google.com/go/db"
)

const limit = 30

func recents(db *database.Client) {
	ctx := context.Background()
	ref := db.NewRef("recent")
	var recents []Recent
	err := ref.Get(ctx, &recents)
	handle(err)
	if len(recents) >= limit {
		recents = recents[len(recents)+1-limit:]
	}
	ref.Set(ctx, recents)
}
