import * as http from 'https';

// Helper request function
export function makeRequest(url, options={}) {
    return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let chunks = [];

      res.on('data', (chunk) => {
          chunks.push(chunk);
        })
        req.on('error', err => {
            reject(err);
        });
        res.on("end", (_chunk) => {
            resolve(Buffer.concat(chunks));
        });
    })
    req.end()
})
}


export async function main(url) {
    let http_options = { "method": "GET", "headers": { "Content-Type": "plain/text" }}
    let res = await makeRequest(url, http_options)
    console.log(res.toString())
}

// Run
// let url = "https://raw.githubusercontent.com/hegerdes/BeeblebroxCTF/master/README.md"
// main(url)

