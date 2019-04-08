// import fly from 'flyio'
import Taro from '@tarojs/taro'

export class Net {
    baseURL: String = 'https://time-machine-firefox.cn/?type=areaScore&area=%E6%B1%9F%E8%8B%8F'

    params: Map<String, String>

    private static instance: Net;

    private constructor() {
        // ..
    }

    public static getInstance() {
        if (!Net.instance) {
            Net.instance = new Net();
        }
    
        return Net.instance;
    }

    async get() {
        await Taro.request({
            url: 'https://time-machine-firefox.cn',
            data: {
                type: 'areaScore',
                area: '江苏',
            }
        })   
    }
}
