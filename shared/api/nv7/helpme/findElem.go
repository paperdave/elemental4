package main

import (
	"fmt"
	"strconv"
	"strings"

	firestore "cloud.google.com/go/firestore"
	database "firebase.google.com/go/db"
)

func findElem(db *database.Client, store *firestore.Client, input []string) {
	data, err := store.Collection("elements").Doc(input[0]).Get(ctx)
	handle(err)
	var newData Element
	err = data.DataTo(&newData)
	items := calcElem(newData, make([]string, 0), store)
	for i, item := range items {
		items[i] = strconv.Itoa(i+1) + ". " + item
	}
	path := strings.Join(items, "\n")
	fmt.Println(path)
}

func unique(arr []string) []string {
	occured := map[string]bool{}
	result := []string{}
	for e := range arr {
		// check if already the mapped
		// variable is set to true or not
		if occured[arr[e]] != true {
			occured[arr[e]] = true

			// Append to result slice.
			result = append(result, arr[e])
		}
	}
	return result
}

func calcElem(elem Element, existing []string, store *firestore.Client) []string {
	for _, parent := range elem.Parents {
		data, err := store.Collection("elements").Doc(parent).Get(ctx)
		handle(err)
		var newData Element
		err = data.DataTo(&newData)
		existing = append(existing, calcElem(newData, existing, store)...)
	}
	if len(elem.Parents) > 0 {
		item := fmt.Sprintf("%s + %s = %s", elem.Parents[0], elem.Parents[1], elem.Name)
		existing = append(existing, item)
	}
	return unique(existing)
}
