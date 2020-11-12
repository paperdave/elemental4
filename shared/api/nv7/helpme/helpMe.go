package main

import (
	"context"
	"fmt"
	"os"

	firestore "cloud.google.com/go/firestore"
	firebase "firebase.google.com/go"
	database "firebase.google.com/go/db"
	"google.golang.org/api/option"
)

// Element has the data for a created element
type Element struct {
	Color     string   `json:"color"`
	Comment   string   `json:"comment"`
	CreatedOn int      `json:"createdOn"`
	Creator   string   `json:"creator"`
	Name      string   `json:"name"`
	Parents   []string `json:"parents"`
	Pioneer   string   `json:"pioneer"`
}

// Color has the data for a suggestion's color
type Color struct {
	Base       string  `json:"base"`
	Lightness  float32 `json:"lightness"`
	Saturation float32 `json:"saturation"`
}

// Suggestion has the data for a suggestion
type Suggestion struct {
	Creator string   `json:"creator"`
	Name    string   `json:"name"`
	Votes   int      `json:"votes"`
	Color   Color    `json:"color"`
	Voted   []string `json:"voted"`
}

// ComboMap has the data that maps combos
type ComboMap map[string]map[string]string

// SuggMap has the data that maps suggestion combos
type SuggMap map[string]map[string][]string

// Recent has the data of a recent element
type Recent struct {
	Parents [2]string `json:"recipe"`
	Result  string    `json:"result"`
}

func handle(err error) {
	if err != nil {
		panic(err)
	}
}

var ctx context.Context

func main() {
	ctx = context.Background()

	opt := option.WithCredentialsJSON([]byte(json))
	config := &firebase.Config{
		DatabaseURL:   "https://elementalserver-8c6d0.firebaseio.com",
		ProjectID:     "elementalserver-8c6d0",
		StorageBucket: "elementalserver-8c6d0.appspot.com",
	}
	app, err := firebase.NewApp(ctx, config, opt)
	handle(err)

	db, err := app.Database(ctx)
	handle(err)

	store, err := app.Firestore(ctx)
	handle(err)
	defer store.Close()

	help := map[string]func(*database.Client, *firestore.Client, []string){
		"findelem":   findElem,
		"listcombos": listCombos,
	}
	if os.Args[1] == "helpme" {
		for key := range help {
			fmt.Print(key + " ")
		}
		fmt.Print("\n")
		return
	}
	help[os.Args[1]](db, store, os.Args[2:])
}
