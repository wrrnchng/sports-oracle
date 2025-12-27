// Test script to check ESPN API endpoints
const testEndpoints = async () => {
    const endpoints = [
        'https://site.api.espn.com/apis/v2/sports/football/nfl/standings',
        'https://site.api.espn.com/apis/site/v2/sports/football/nfl/standings',
    ]

    for (const url of endpoints) {
        console.log(`\nTesting: ${url}`)
        try {
            const response = await fetch(url)
            console.log(`Status: ${response.status} ${response.statusText}`)
            if (response.ok) {
                const data = await response.json()
                console.log('Success! Keys:', Object.keys(data))
            } else {
                console.log('Failed')
            }
        } catch (error) {
            console.error('Error:', error.message)
        }
    }
}

testEndpoints()
