import Taro, { Component, Config, request } from '@tarojs/taro';
import { View } from '@tarojs/components';
import { AtSearchBar, AtList, AtListItem, AtMessage, AtActivityIndicator } from 'taro-ui'
import { GKStore } from '../../Utils/GKStore';

export default class Search extends Component {
    config: Config = {
        navigationBarTitleText : '搜索'
    }


    type: String = ""
    arts_li_ke: String = "文科"
    area: String = "江苏"
    state={
        datas: [],
        searchValue: "",
        loading: false,
        
    }
    constructor() {
        super(...arguments)
    }
    
    componentWillMount() {
        const p = this.$router.params
        this.type = p['type']
        this.arts_li_ke = p['arts_li_ke']
        this.area = p['area']
    }
    requestSchool() {
        
        const p = new Promise<any>((res,rej)=>{
        this.setState({
            loading: true,
        })
        let reqP = {}
        if (this.type === 'School') {
            reqP = {
                type: 'searchSchool',
                school: this.state.searchValue
            }
        } else {
            const { school} = GKStore.getInstance()
            reqP = {
                type: 'searchMajor',
                school: school,
                majore: this.state.searchValue,
                arts: this.arts_li_ke,
                area: this.area,
            }
        }
          
    
          console.log(reqP)
    
          Taro.request({
              url: 'https://time-machine-firefox.cn',
              data: reqP,
              success: (r)=>{
                  res(r.data)
                  this.setState({
                    loading: false,
                })
              },
              fail: (e) => {
                rej(e)
              }
              
          })   
       })
       return p
      }

    onChange (value) {
        this.setState({
            searchValue: value
        })

    
    }

    onActionClick(){
        this.requestSchool().then(result=>{
            console.log(result);
            if (result.length<=0) {
                Taro.atMessage({
                    'message': '暂无数据',
                    'type': 'error',
                  })
                  return;
            } 
            this.setState({
                datas: result
            })
        })
    }

    handleClick (item) {
        console.log(item)
        GKStore.getInstance().school = item.school;
        GKStore.getInstance().major = item.major;
        Taro.navigateBack()
    }

    render() {
        const { datas, loading } = this.state;
        
        const lists = datas.map(item=>{

            if (this.type === 'School') {
                return <AtListItem title={item.school} onClick={()=>{
                    this.handleClick(item)
                }} key={item.school}/>
            } 
            return <AtListItem title={item.major} onClick={()=>{
                this.handleClick(item)
            }} key={item.major}/>
        })
        return (
            <View style={{position: 'relative'}}>
                <AtMessage />
                <AtSearchBar
                value={this.state.searchValue}
                onChange={this.onChange.bind(this)}
                onActionClick={this.onActionClick.bind(this)}
                />
                {loading?<AtActivityIndicator size={64} mode='center'></AtActivityIndicator>: null}
                {datas.length <= 0 ? null : <AtList>
                    {lists}
                    
                    {/* <AtListItem title='标题文字' arrow='right' />
                    <AtListItem title='标题文字' extraText='详细信息' />
                    <AtListItem title='禁用状态' disabled extraText='详细信息' /> */}
                </AtList>
                }
            </View>
            
        )
    }
}