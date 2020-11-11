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

const json = `{ "type": "service_account", "project_id": "elementalserver-8c6d0", "private_key_id": "23a990e4b4080c944a65e6b219817321c4709877", "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCYefd5YNuEftFV\nlogAGgLFBn0oFf7J1+RFZgsV1QZVFA3MagWq4GX6oQmdhphT8vPt0Jn2Xuyzz6PK\n0PljjreNWwBabTRuK2R+wbMChpb3X1tz8Unc1h6EjCL4kZCseqA9e9ozYm/qpmOr\nWca0yd+bAXpgic2TuMCdkKNxiuvPpQIzIXpV/eQQr26VOoiJDagiWvZ4DdOoWGpE\nJRSFRRdXYuQKa0va/puGBgOtjkKFiRgV9boldYkiRLlOIC1xRIoxX8tUpGM73OUw\nDPEbzlqEZ3SfCrgj5Gs1g9G0Tc+d68RzBevK8rkkUAXPcfQwU4QqSTg+v4yzNLtc\nNVbXlc3BAgMBAAECggEAAnTtCDThQvy0tg6sNGcDr+jnZ9ew4jYuP9fOamsWasg2\n4ubVBNhdDeFKqx6lAi2qNGT8MhRixBC4QiQrVhx4BL9+w8/TvJZ9sq6MY8hHRiDK\nDUk9CC45no4DSAkdl5XZn2jJNRlxlbDAIhDnsXgf0cEy/e61rZr+tk5ppijxNm60\nq/cybMWgg/9xy472uisDwX6AJOmsrUtU8zlRFyRpeKhzksDt5qpaa5qmfqquGnd6\nWJLfiGZB+EqQ/DDxqHPeUSKpU3IDZ8GeobnLkxAjFiYOf8vNysPcW2HKPjv+KF7i\nJuNtIC/TM0YGobYAGPOZFzjON6803x0w8JCsbChtUQKBgQDPRzdCcoS/0Osw2lRl\nRsd+o58P6ET0Dw7b7qbbaWicfF7zLUCCj4EU2MtSR2Y9cIbChJppuUag+Qe8K75o\ntPbBtbl3zowHFdq1OiJE+Y7AkuYhsnDdHXEuZi/aQqCGNAWwG2MxbPAIinPZRsmK\n13r0sPniPax5MSupavwG0R0caQKBgQC8URphZq3QUu28V2a0cig3KpIk1xSZyOx/\nl6yGW9oA91OMl16IeAZWBJ9Q8R1MoCjdx6hbz8QY3d5Jebl1K0KgWMruahJ7EP7V\nHv2qzGMU+ImXbHwvLqIYUza5BefQDA3VXUcPQ9n87qhgVVnGg778P/ykyT9z3wTA\n+rZHcpLbmQKBgEIhWXsEqF++WtsKPTTWoR1BPKVJmH45M6dte6Sy+6I5d92jyVoe\nSLOK+0tz5iWh+gyjW9RxPRxsd1BMsIIdgkCJJvQXXMuB6HY7ZuWUrTu5YlzL3oBd\nPVftWEUNTsOiY1ItWrdRJz/CVHW0xOZcGyloMUFCJf3Ad0qlDGVsYBpJAoGBAIcs\nKCV2EJmSjTc9/WjU8Gz4z8JF6HGiua+0bZBb6hX7citek+qdTN79nmX5TLCt3eej\n4wNUFUxMJbzT9P1XuhFi6vdLiExyHJlaD3dEEnMBG7JnmpQ7gvq28HbK+GRr4poe\nxFz+tUBLBu1vFmvaMYLbYzvdgQBpOv5Sd/i9ExExAoGADuq36SFadtMoaGzr8/R2\nn3jEWvd/cdTj5997kgt6UQ6MGnemyAA+qQzJd90RB8+c/jXLGqQp4S1N/np2Ri2I\no1I1JIMZAA3O0QWW21VxwWUEiy8lcieC6Qi8O/ItL267DGWr/Th7L0dMneV5mPQ3\nNJQnNLbwGameCoi3C9QHHoM=\n-----END PRIVATE KEY-----\n", "client_email": "firebase-adminsdk-2joyb@elementalserver-8c6d0.iam.gserviceaccount.com", "client_id": "107064046663721470073", "auth_uri": "https://accounts.google.com/o/oauth2/auth", "token_uri": "https://oauth2.googleapis.com/token", "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs", "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-2joyb%40elementalserver-8c6d0.iam.gserviceaccount.com" }`

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
