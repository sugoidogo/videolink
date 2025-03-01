# VideoLink
Find a video's direct download link from its webpage using Puppeteer

# Requirements
VideoLink uses [puppeteer](https://pptr.dev/),
which you can see [the requirements for here](https://pptr.dev/guides/system-requirements).

# Usage
Download, install, and start the server:
```bash
git clone https://github.com/sugoidogo/videolink.git && cd videolink
npm install
npm start
```
VideoLink listens on port `10101`.
I'd recommend putting it behind an HTTPS proxy for security.
Making a request is simple:
```js
async function getVideoURL(page_url){
  const url=new URL('http://localhost:10101')
  url.searchParams.append('url',page_url)
  const response=await fetch(url)
  return response.text()
}
```