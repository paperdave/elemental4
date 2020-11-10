package main

import (
	"context"

	firestore "cloud.google.com/go/firestore"
	database "firebase.google.com/go/db"
)

func fixCombos(db *database.Client, store *firestore.Client) {
	ctx := context.Background()
	var suggMap ComboMap
	db.NewRef("suggestionMap").Get(ctx, &suggMap)
}
