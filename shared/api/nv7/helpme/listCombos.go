package main

import (
	"fmt"

	firestore "cloud.google.com/go/firestore"
	database "firebase.google.com/go/db"
)

func listCombos(db *database.Client, store *firestore.Client, input []string) {
	ref := db.NewRef("/suggestionMap")
	var suggMap SuggMap
	err := ref.Get(ctx, &suggMap)
	handle(err)
	for elem1, val := range suggMap {
		for elem2 := range val {
			fmt.Println(elem1, "+", elem2)
		}
	}
}
