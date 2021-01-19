package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/url"
	"os"
	"regexp"
	"sort"

	"github.com/lucasb-eyer/go-colorful"
)

const file = "pack.txt"
const outFile = "pack.pack"

const colMap = `{"aqua":"#54E3B3","black":"#000000","blue":"#72AEDA","brown":"#B58148","dark-blue":"#7289DA","green":"#7BFAFF","grey":"#7F7F7F","hot-pink":"#E354A2","magenta":"#D054E3","orange":"#E38454","purple":"#8654E3","red":"#E35454","white":"#FFFFFF","yellow":"#E3CB54","yellow-green":"#B3E354"}`

var hMap []hVal
var eMap map[string]string
var edat map[string]interface{} = make(map[string]interface{}, 0)

type hVal struct {
	h   float64
	col string
}

type elem struct {
	Name    string   `json:"name"`
	Color   string   `json:"color"`
	Comment string   `json:"comment"`
	Parents []string `json:"parents"`
}

func calcColor(input string) string {
	c, err := colorful.Hex("#" + input)
	if err != nil {
		panic(err)
	}
	h, s, l := c.Hsl()
	var index int
	for i, val := range hMap {
		if val.h > h {
			index = i
			if val.h-h > hMap[i-1].h-h {
				index--
			}
			break
		}
	}
	base := hMap[index].col
	return fmt.Sprintf("%s_%0.2f_%0.2f", base, s*2-1, l*2-1)
}

func main() {
	// Init
	dat, _ := ioutil.ReadFile(file)
	data := string(dat)
	var colDat map[string]string
	json.Unmarshal([]byte(colMap), &colDat)
	i := 0
	hMap = make([]hVal, len(colDat))
	for k, v := range colDat {
		col, err := colorful.Hex(v)
		if err != nil {
			panic(err)
		}
		h, _, _ := col.Hsl()
		val := hVal{h, k}
		hMap[i] = val
		i++
	}
	sort.Slice(hMap, func(i, j int) bool { return hMap[i].h < hMap[j].h })

	// Colors
	rCol := regexp.MustCompile(`#? ?(.+):[ \t]+#(.+)`)
	colors := rCol.FindAllStringSubmatch(data, -1)
	eMap = make(map[string]string, 0)
	for _, val := range colors {
		k := val[1]
		v := calcColor(val[2])
		eMap[k] = v
	}

	// Elements
	rDesc := regexp.MustCompile(`(.+) -[ \t]+(.+)`)
	descs := rDesc.FindAllStringSubmatch(data, -1)
	for _, val := range descs {
		edat[val[1]] = elem{
			Name:    val[1],
			Comment: val[2],
		}
	}

	// Combos
	rComb := regexp.MustCompile(`(.+) \+ (.+) =[ \t]+(.+) \((.+)\)`)
	combos := rComb.FindAllStringSubmatch(data, -1)
	for _, val := range combos {
		vals := []string{val[1], val[2]}
		sort.Strings(vals)
		edat[url.PathEscape(vals[0])+"+"+url.PathEscape(vals[1])] = val[3]
		ev, exists := edat[val[3]].(elem)
		if !exists {
			ev = elem{
				Name:    val[3],
				Comment: "",
			}
		}
		ev.Parents = []string{val[1], val[2]}
		ev.Color = eMap[val[4]]
		edat[val[3]] = ev
	}

	// Base Elements
	rBase := regexp.MustCompile(`\n([a-zA-Z0-9_]+) \((.+)\)`)
	bases := rBase.FindAllStringSubmatch(data, -1)
	for _, val := range bases {
		ev, exists := edat[val[1]].(elem)
		if !exists {
			ev = elem{
				Name:    val[1],
				Comment: "",
			}
		}
		ev.Color = eMap[val[2]]
		ev.Name = val[1]
		edat[val[1]] = ev
	}

	elemDat, _ := json.Marshal(edat)

	out := make(map[string]string, 0)
	out["data"] = string(elemDat)

	rID := regexp.MustCompile(`Id=(.+)`)
	id := rID.FindAllStringSubmatch(data, -1)[0][1]
	out["id"] = id

	rTitle := regexp.MustCompile(`Title=(.+)`)
	title := rTitle.FindAllStringSubmatch(data, -1)[0][1]
	out["title"] = title

	rDescription := regexp.MustCompile(`Description=(.+)`)
	description := rDescription.FindAllStringSubmatch(data, -1)[0][1]
	out["description"] = description

	final, _ := json.Marshal(out)

	f, _ := os.OpenFile(outFile, os.O_WRONLY|os.O_CREATE, os.ModePerm)
	f.Truncate(0)
	defer f.Close()
	f.Write(final)
}
