import * as http from "https";

// Helper request function
export const makeRequest = async (url, options = {}): Promise<Buffer> => {
  return new Promise<Buffer>((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      const chunks = [];

      res.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });
      req.on("error", (err) => {
        reject(err);
      });
      res.on("end", (_chunk: Buffer) => {
        resolve(Buffer.concat(chunks));
      });
    });
    req.end();
  });
};

export async function main(url) {
  const http_options = {
    method: "GET",
    headers: { "Content-Type": "plain/text" },
  };
  const res = await makeRequest(url, http_options);
  console.log(res.toString());
}

// Run
// let url = "https://raw.githubusercontent.com/hegerdes/BeeblebroxCTF/master/README.md"
// main(url)
