require('dotenv').config();
const fetch = require('node-fetch');
const FormData = require('form-data');
const { createReadStream } = require('fs');
 
const superproperties = Buffer.from(JSON.stringify({
    'os': 'Windows',
    'browser': 'Firefox',
    'device': '',
    'browser_user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:73.0) Gecko/20100101 Firefox/73.0',
    'browser_version':'73.0',
    'os_version':'10',
    'referrer': '',
    'referring_domain': '',
    'referrer_current': '',
    'referring_domain_current': '',
    'release_channel': 'stable',
    'client_build_number': 55975,
    'client_event_source': null
})).toString('base64');

/**
 * Get the X-Fingerprint header from Discord.
 * Borrowed from myself.
 * @see https://github.com/KhafraDev/discord-verify/blob/master/src/modules/fingerprint.js
 */
const fingerprint = async () => {
    const ContextProperties = Buffer.from(JSON.stringify({ 
        location: 'Login' 
    })).toString('base64');

    const res = await fetch('https://discordapp.com/api/v6/experiments', {
        headers: {
            'Accept': '*/*',
            'Accept-Language': 'en-US',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:73.0) Gecko/20100101 Firefox/73.0',
            'X-Fingerprint': '',
            'X-Context-Properties': ContextProperties // somehow missed this completely
        }
    });

    if(res.status === 200) {
        return res.json();
    } else if(res.status === 403) {
        throw new Error('Status 403 received, try using a different IP address.');
    }
    
    throw new Error(`Received status ${res.status} (${res.statusText}).`);
}

/**
 * Upload a file to Discord.
 * @param {{ content?: string, tts?: boolean, path: string }} options 
 */
const send = async ({ content='', tts=false, path }) => {
    const form = new FormData();
    form.append('content', content);
    form.append('tts', '' + tts);
    form.append('my_file', createReadStream(path));

    const res = await fetch(`https://discordapp.com/api/v6/channels/${process.env.CID}/messages`, {
        method: 'POST',
        body: form,
        headers: {
            ...form.getHeaders(), // 'content-type': 'multipart/form-data; boundary=--------------------------...
            'Host': 'discordapp.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:73.0) Gecko/20100101 Firefox/73.0',
            'Accept': '*/*',
            'Accept-Language': 'en-US',
            'Authorization': process.env.TOKEN,
            'X-Super-Properties': superproperties,
            'X-Fingerprint': await fingerprint()
        }
    });

    if(res.status === 200) {
        const r = await res.json();
        return r.attachments[0];
    } else {
        throw new Error('Something went wrong! Received status ' + res.status + '.');
    }
}

module.exports = send;