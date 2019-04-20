let fetch = require("node-fetch")
let { songsWhosePreprocessedTitleContains } = require("./databaseUtils")

async function Main() {
    let output = await songsWhosePreprocessedTitleContains("Drugs")
    console.log(`output is:`, output)
}
Main()
