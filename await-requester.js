let fs = require('fs')
let words = require('./words.json')
let request = require('request'); // "Request" library

let client_id = 'ae0c7d4b643a4704834c56db9b43be99'; // Your client id
let client_secret = 'c3e1c56556874faca3610eb866f1daf4'; // Your secret
let limit = 50 // how many songs per search
let output_file = 'docs.csv' // where output is saved


// a helper for making actual spotify requests
let createOptions = (word, limit, token) => {
    // encode it for the string
    word = encodeURIComponent(word)
    return {
        url: `https://api.spotify.com/v1/search?q=${word}&type=track&limit=${limit}`,
        headers: {
            'Authorization': 'Bearer ' + token
        },
        json: true
    };
}

let removeCommas = (word) => {
    return word.replace(/,/g, '')
}

let makeAwaitable = (aFunction) =>
    (...args) => new Promise((resolve) => aFunction(...args, (...response_args) => resolve(response_args)))

let getRequest = makeAwaitable((...args) => request.get(...args))
let postRequest = makeAwaitable((...args) => request.post(...args))
let appendFile = makeAwaitable((...args) => (fs.appendFile(...args)))


/**
 * This is an example of a basic node.js script that performs
 * the Client Credentials oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#client_credentials_flow
 */
// your application requests authorization
let authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
        'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64')
    },
    form: {
        grant_type: 'client_credentials'
    },
    json: true
};
let starting_point = 0
// if there is an argument
if (process.argv[2]) {
    starting_point = process.argv[2]
}

// wrap everything in an async function so that await can be used
let main = async () => {
    // for each word
    for (let i = starting_point; i < words.length; ++i) {
        // log every 100 words
        (i % 100 == 0) && console.log(`${i} doing word ${words[i]}`)

        // init some vars
        let error, response, body
        // get the credentials (they will be good for about a few minutes or more)
        // await the call before going to the next word
        [error, response, body] = await postRequest(authOptions)
        statusCode = (response||{}).statusCode
        // log errors
        if (error || statusCode != 200) {
            console.log('response.statusCode = ', statusCode)
            console.log(`body is:`, body)
            console.log(`error is:`, error)
            process.exit()
        // if success
        } else {
            options = createOptions(words[i], limit, body.access_token)
            // use the access token to access the Spotify Web API
            [error, response, body] = await getRequest(authOptions)
            // handle errors
            if (error || response.statusCode != 200) {
                console.log('response.statusCode = ', response.statusCode)
                console.log(`body is:`, body)
                console.log(`error is:`, error)
                process.exit()
            // if success
            } else {
                results = (((body || {}).tracks || {}).items || [])
                // check if no results
                if (results.length == 0) {
                    console.log(`no results found for `, words[i])
                } else {
                    all_songs_for_this_search = ""
                    // put each of the results on a newline in a string
                    for (let each of results) {
                        // get the artist name if it exists
                        artist_name = ((each.artists || {})[0] || {}).name
                        // add it to the string
                        all_songs_for_this_search += `${each.id}, ${removeCommas(artist_name)}, ${removeCommas(each.name)}\n`
                    }
                    // save the string to the file
                    [error] = await appendFile(output_file, all_songs_for_this_search)
                    if (error) {
                        console.error(error)
                        process.exit()
                    }
                }
            }
        }
    }
}
main()
