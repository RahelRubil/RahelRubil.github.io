const cheerio = require('cheerio');
const fs = require('fs');

// För att fördröja anropen (vänta 500 millisekunder)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function scrapeAllabolag() {
    // Listan med alla sidor som ska skrapas
    const urls = [
        'https://www.allabolag.se/bransch-s%C3%B6k?q=tandläkare',
        'https://www.allabolag.se/bransch-s%C3%B6k?q=tandläkare&page=2',
        'https://www.allabolag.se/bransch-s%C3%B6k?q=tandläkare&page=3',
        'https://www.allabolag.se/bransch-s%C3%B6k?q=tandläkare&page=4',
        'https://www.allabolag.se/bransch-s%C3%B6k?q=tandläkare&page=5'
    ];

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    };

    // Här förbereder vi en variabel där vi kan lägga till en proxy i framtiden om det behövs
    // T.ex. const proxyAgent = undefined; och skicka med i fetch-options.
    const fetchOptions = {
        headers,
        cache: 'no-store' // Säkerställer att vi alltid hämtar en färsk kopia utan cache
    };

    let allCompanies = [];

    // Gå igenom varje länk i listan en i taget
    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const pageNumber = i + 1;

        console.log(`Hämtar sida ${pageNumber}: ${url}`);

        try {
            const response = await fetch(url, fetchOptions);

            if (!response.ok) {
                throw new Error(`Kunde inte hämta sidan. Statuskod: ${response.status}`);
            }

            const html = await response.text();
            const $ = cheerio.load(html);

            const pageCompanies = [];

            $('.SearchResultCard-card').each((index, element) => {
                const card = $(element);

                const name = card.find('h2 a').first().text().trim();

                let orgNr = '';
                card.find('.CardHeader-propertyList').each((idx, el) => {
                    const text = $(el).text();
                    if (text.includes('Org.nr')) {
                        orgNr = text.replace('Org.nr', '').trim();
                    }
                });

                let phone = '';
                const phoneEl = card.find('.CardHeader-phone');
                if (phoneEl.length > 0) {
                    phone = phoneEl.text().replace('Telefon', '').trim();
                }

                let address = '';
                card.find('.SearchResultCard-iconDataContainer span').each((idx, el) => {
                    const spanText = $(el).text().trim();
                    if (spanText && !spanText.startsWith('Org.nr') && !spanText.startsWith('Telefon')) {
                        address = spanText;
                    }
                });

                if (name) {
                    pageCompanies.push({
                        name,
                        orgNr,
                        phone,
                        address
                    });
                }
            });

            console.log(`Sida ${pageNumber} gav ${pageCompanies.length} objekt.`);
            
            // Lägg till företag från denna sida till den totala listan
            allCompanies = allCompanies.concat(pageCompanies);

        } catch (error) {
            console.error(`Fel på sida ${pageNumber}: ${error.message}. Fortsätter med nästa...`);
        }

        // Vänta 500 millisekunder innan nästa sida hämtas (om det inte är sista sidan)
        if (i < urls.length - 1) {
            await sleep(500);
        }
    }

    if (allCompanies.length === 0) {
        console.log('Hittade inga företag totalt sett.');
        return;
    }

    // Skapa CSV-innehåll för alla samlade företag
    let csvContent = '"Företagsnamn","Organisationsnummer","Telefonnummer","Adress"\n';

    allCompanies.forEach(c => {
        csvContent += `"${c.name}","${c.orgNr}","${c.phone}","${c.address}"\n`;
    });

    fs.writeFileSync('foretag.csv', csvContent, 'utf-8');

    console.log(`Klart! Totalt sparades ${allCompanies.length} företag till foretag.csv`);
}

scrapeAllabolag();Bash