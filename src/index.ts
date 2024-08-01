import { ethers } from 'ethers'
import axios from 'axios'

const BSC_RPC_PROVIDER_URL = 'https://bsc-mainnet.nodereal.io/v1/54418b8a87df4f9fa7cf1ca161cdad9f'
const USER_PHRASE = 'cook slight wrist shrug vote size picture critic daring unknown soda fence'
const ALIAS_PHRASE = 'capital special melody quantum weekend staff train huge among hip echo track'
const DOMAIN = {
    name: 'snapshot',
    version: '0.1.4',
};

async function botsFollow(start: number, end: number) {
    const provider = new ethers.JsonRpcProvider(BSC_RPC_PROVIDER_URL)
    const userNode = ethers.HDNodeWallet.fromPhrase(USER_PHRASE)
    const aliasNode = ethers.HDNodeWallet.fromPhrase(ALIAS_PHRASE)

    for (let i = start; i < end; ++i) {
        const userWallet = new ethers.Wallet(userNode.deriveChild(i).privateKey, provider)
        const aliasWallet= new ethers.Wallet(aliasNode.deriveChild(i).privateKey, provider)

        await alias(aliasWallet.address, userWallet)
        await follow(userWallet.address, aliasWallet)
    }
}

async function alias(aliasAddress: string, userWallet: ethers.Wallet) {
    const types = {
        Alias: [
            {
                name: 'from',
                type: 'address',
            },
            {
                name: 'alias',
                type: 'address',
            },
            {
                name: 'timestamp',
                type: 'uint64',
            },
        ],
    }
    const message = {
        alias: aliasAddress,
        from: userWallet.address,
        timestamp: parseInt((Date.now() / 1e3).toFixed()),
    }

    const data = { domain: DOMAIN, types, message }
    const sig = await userWallet.signTypedData(DOMAIN, types, message);
    await send({address: userWallet.address, sig, data})
}

async function follow(userAddress: string, aliasWallet: ethers.Wallet) {
    const types = {
        Follow: [
            {
                name: 'from',
                type: 'address',
            },
            {
                name: 'network',
                type: 'string',
            },
            {
                name: 'space',
                type: 'string',
            },
            {
                name: 'timestamp',
                type: 'uint64',
            },
        ],
    }
    const message = {
        from: userAddress,
        network: 's',
        space: 'listavote.eth',
        timestamp: parseInt((Date.now() / 1e3).toFixed()),
    }

    const data = { domain: DOMAIN, types, message }
    const sig = await aliasWallet.signTypedData(DOMAIN, types, message);
    await send({address: aliasWallet.address, sig, data})
}

async function send(envelop: any) {
    try {
        const resp = await axios({
            url: 'https://seq.snapshot.org/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 30000,
            data: JSON.stringify(envelop),
        })
        console.log('Resp:',
            {
                status: resp.status,
                data: resp.data,
            }
        )
        return resp
    } catch (error: any) {
        console.log(`send error: ${error?.message}`, error)
    }
}

if (process.argv.length > 3) {
    botsFollow(parseInt(process.argv[2]), parseInt(process.argv[3]))
} else {
    console.log('2 arguments expected!')
}
