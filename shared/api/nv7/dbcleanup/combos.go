package main

import (
	"context"
	"fmt"

	firestore "cloud.google.com/go/firestore"
	database "firebase.google.com/go/db"
)

func fixCombos(db *database.Client, store *firestore.Client) {
	ctx := context.Background()
	var suggMap SuggMap
	ref := db.NewRef("suggestionMap")
	err := ref.Get(ctx, &suggMap)
	handle(err)
	for elem1, val := range suggMap {
		var combos map[string]string
		data, err := store.Collection("combos").Doc(elem1).Get(ctx)
		data.DataTo(&combos)
		if err == nil {
			for elem2 := range val {
				data.DataTo(combos)
				_, exists := combos[elem2]
				if exists {
					delete(suggMap[elem1], elem2)
					fmt.Printf("Combo %s + %s Deleted\n", elem1, elem2)
				}
			}
		}
	}
	ref.Set(ctx, suggMap)
}
