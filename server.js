console.debug('loading')
import 'dotenv/config';
import puppeteer from "puppeteer";
import http from 'http';

const cache = {}

function msToTime(ms) {
    let seconds = (ms / 1000).toFixed(1);
    let minutes = (ms / (1000 * 60)).toFixed(1);
    let hours = (ms / (1000 * 60 * 60)).toFixed(1);
    let days = (ms / (1000 * 60 * 60 * 24)).toFixed(1);
    if (seconds < 60) return seconds + " seconds";
    else if (minutes < 60) return minutes + " minutes";
    else if (hours < 24) return hours + " hours";
    else return days + " Days"
}

console.debug('launching puppeteer')
const browser = await puppeteer.launch({ timeout: 60000,  })

console.debug('starting webserver')
const server=http.createServer(async function (request, response) {
    let page = null
    function errorHandler(reason) {
        response.writeHead(400, reason.toString())
        response.end()
        page.close()
        page = null
    }
    try {
        const query = request.url.substring(request.url.indexOf('?'))
        const params = new URLSearchParams(query)
        const url = params.get('url')
        console.debug(url)
        if (!url) {
            response.writeHead(400, "missing query parameter: url")
            return response.end()
        }
        let videoURL = null
        let ttl=null
        if (url in cache) {
            videoURL = cache[url].videoURL
            ttl=cache[url].expires-Math.floor(Date.now()/1000)
            console.debug('cache hit')
        } else {
            console.debug('cache miss')
            page = await browser.newPage()
            await page.goto(url).catch(errorHandler)
            const video = await page.waitForSelector('video').then(v => v, errorHandler)
            const handle = await video.getProperty('src')
            videoURL = handle.remoteObject().value
            page.close()
            page = null
            const token=JSON.parse(new URL(videoURL).searchParams.get('token'))
            ttl=token.expires-Math.floor(Date.now()/1000)
            cache[url] = {videoURL,expires:token.expires}
            setTimeout(()=>delete cache[url],ttl*1000)
            console.debug('cached url expires in '+msToTime(ttl*1000))
        }
        response.writeHead(200, undefined, {
            'access-control-allow-origin': '*',
            'cache-control':'public, immutable, max-age='+ttl
        })
        response.write(videoURL)
        response.end()
    } catch (e) {
        console.error(e)
        if (!response.writableEnded) {
            response.writeHead('500', e.message)
            response.end()
        }
    } finally {
        if (page) {
            page.close()
        }
        console.log('request complete')
    }
})
server.listen(10101)

function shutdown(){
    console.debug('stopping server')
    server.close(async ()=>{
        console.debug('stopping puppetter')
        await browser.close()
        console.debug('goodbye')
        process.exit(0)
    })
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.debug('ready')