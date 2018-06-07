var scraperjs = require('scraperjs')
var mongoose = require('mongoose')

var Drugs = require('./drugs')
mongoose.connect("mongodb://127.0.0.1/drugs")

scrapeURL = () => {

	baseURL = "https://www.medindia.net/doctors/drug_information/home.asp?alpha="

	// Scrape all drugs starting with given alphabet
	scrape_drugs_by_alphabet = (baseURL, alpha) => {
		console.log("Scrapping URLs for drugs starting with " + alpha)

		url = baseURL + alpha

		scraperjs.StaticScraper.create(url)
		.scrape(($) => {
			return $(".list-item a")
		})
		.then((list) => {
			for(i=0; i<list.length; i++){
				drug = formatDrug(list[i].children[0].data, list[i].attribs.href)
				saveDrug(drug)
			}
		})
	}

	//Format a raw drug
	formatDrug = (name, url) => {
		var drugSchema = {
			name: name,
			url: url,
			lastUpdated: new Date(0)
		}

		return Drugs(drugSchema)
	}

	//Create a new model instance with our object
	saveDrug = (drug) => {
		drug.save((err, data) => {
			if (err) {
				if (err.code == 11000) {
					return
				} else {
					console.log("Something went wrong :(  \n" + err)
					return
				}
			} else {
				console.log('URL successfully stored.')
			}
		})
	}

	// Loop for all the alphabets
	for (i = 65; i <= 90; i++) {
		alpha = String.fromCharCode(i).toLowerCase()
		scrape_drugs_by_alphabet(baseURL, alpha)
	}
}

// Scrape drug details
scrapeDrugDetails = () => {
	baseURL = "https://www.medindia.net/drugs/trade-names/"
	
	scrapeAndUpdate = (drug) => {
		url = baseURL + drug.url

		scraperjs.StaticScraper.create(url)
		.scrape(($) => {
			return $(".report-content a")
		})
		.catch((err) => {
			console.log(err)
			return
		})
		.then((brands) => {
			updated_brands = []
			if(brands.length != 0) {
				for(i=0; i<brands.length; i++) {
					updated_brands.push(brands[i].children[0].data)
				}
			}
			console.log(drug.url + " " + updated_brands.length)

			Drugs.update({"_id": drug._id },
						   {"$set": { "brands": updated_brands, "lastUpdated": new Date()}},
						   (err, n) => {
				if(err){
					console.log("Something went wrong :( \n" + err)
                    return
				}

				console.log("Drug brands updated successfully.")
			})
		})
	}

	var cutoff = new Date()
	cutoff.setDate(cutoff.getDate() - 7)

	var q = Drugs.find({"lastUpdated": { $lt: cutoff }})
				 .limit(5)
	
	q.exec((err, drugs) => {
		console.log(drugs.length)
		if(err) {
			console.log("Something went wrong :(  \n" + err)
			setTimeout(screpDrugDetails, 2000)
			return
		}

		if (drugs == []) {
			setTimeout(scrapeDrugDetails, 6.048e+8)
			return
		}

		for(i=0; i<drugs.length; i++){
	            scrapeAndUpdate(drugs[i])
		}

		setTimeout(scrapeDrugDetails, 2000)
	})

    return
}

scrapeDrugDetails()
//scrapeURL()
