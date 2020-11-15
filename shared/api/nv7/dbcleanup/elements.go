package main

import (
	"context"
	"fmt"

	firestore "cloud.google.com/go/firestore"
	database "firebase.google.com/go/db"
)

func fixElements(db *database.Client, store *firestore.Client) {
	ctx := context.Background()
	var suggMap SuggMap
	err := db.NewRef("suggestionMap").Get(ctx, &suggMap)
	handle(err)

	var suggs map[string]Suggestion
	var newSuggs map[string]Suggestion
	ref := db.NewRef("suggestions")
	err = ref.Get(ctx, &suggs)
	handle(err)
	err = ref.Get(ctx, &newSuggs)
	handle(err)

	for _, val := range suggMap {
		for _, outs := range val {
			for _, elem := range outs {
				delete(suggs, elem)
			}
		}
	}

	for key := range suggs {
		delete(newSuggs, key)
		fmt.Printf("%s Deleted\n", key)
	}

	err = ref.Set(ctx, newSuggs)
	handle(err)
}
