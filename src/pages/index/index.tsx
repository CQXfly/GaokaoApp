import Taro, { Component, Config, request } from '@tarojs/taro'
import { View, Text, ScrollView, Button, Picker, Input } from '@tarojs/components'
import './index.scss'
import { Net } from '../../Utils/GKNet'

import BarChart from '../../components/BarChart'
import LineChart from '../../components/LineChart'

import { AtButton, AtSegmentedControl,AtActivityIndicator, AtMessage } from 'taro-ui'
import { any } from 'prop-types';
import { AtSegmentedControlProps } from 'taro-ui/@types/segmented-control';
import { GKStore } from '../../Utils/GKStore';



export default class Index extends Component {

  /**
   * 指定config的类型声明为: Taro.Config
   *
   * 由于 typescript 对于 object 类型推导只能推出 Key 的基本类型
   * 对于像 navigationBarTextStyle: 'black' 这样的推导出的类型是 string
   * 提示和声明 navigationBarTextStyle: 'black' | 'white' 类型冲突, 需要显示声明类型
   */
  config: Config = {
    navigationBarTitleText: '首页',
  }
  barChart: LineChart;
  state={
    selector: ['北京', '天津', '辽宁', '吉林', '黑龙江', '上海', '江苏', '浙江'
    , '安徽', '福建', '山东', '湖北', '湖南', '广东', '重庆', '四川', '陕西', '甘肃', '河北', '山西', '内蒙古'
    , '河南', '海南', '广西', '贵州', '云南', '西藏', '青海', '宁夏', '新疆', '江西', '香港', '澳门', '台湾'],
    current: 0,
    wenliKe: 0,
    selectorChecked: '江苏',
    searchType: 'areaScore',
    info: null,
    school: '',
    majore: '',
    segValues: ['地区分数线查询', '学校分数查询', '专业分数查询'],
    loading: false,
  }

  currentScores: Map<String,any>

  constructor() {
    super(...arguments)
    
  }

  handleWLClikc(value) {
    this.setState({
      wenliKe: value
    })
  }
  handleClick (value) {
    if (value === 0){
      this.setState({
        current: value,
        searchType: 'areaScore'
      },()=>{
        this.resreshArea(()=>{
       
        })
      })
    } else if (value === 1) {
      this.setState({
        current: value,
        searchType: 'schoolScore',
      },()=>{
        this.refreshSchool()
      })
    } else if (value === 2) {
      this.setState({
        current: value,
        searchType: 'majore',
      },()=>{
        this.refreshMajor()
      })
    }

   
  }

  requestGaokao() {
    this.setState({
      loading: true,
    })
    const p = new Promise<any>((res,rej)=>{
      const {searchType, selectorChecked, } = this.state
      const {school, major} = GKStore.getInstance()
  
      const reqP = {
        type: searchType,
        area: selectorChecked,
        arts: this.state.wenliKe === 0 ?'文科' : '理科',
        majore: major,
        school: school,

      }

      console.log(reqP)

      Taro.request({
          url: 'https://time-machine-firefox.cn',
          data: reqP,
          success: (r)=>{

            if (r.data.length<=0) {
              Taro.atMessage({
                  'message': '暂无数据',
                  'type': 'error',
                })
            } 
              res(r)
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

  refreshMajor() {
    this.requestGaokao().then(res=>{
      console.log(res)

      const results : [] = res.data;
      results.forEach((item: any)=>{
        if (item.enroll_lot === '本科一批') {
          item.enroll_lot = '第一批'
        } else if (item.enroll_lot === '本科二批') {
          item.enroll_lot = '第二批'
        }
      })
      const sors = results.sort((a: any,b: any)=>{
        const x = Number(a.enroll_age)
        const y = Number(b.enroll_age)
         if ( x > y){
           return 1
         } else if (x < y)  {
           return -1
         } else {
           return 0
         }
      }).reduce((result, item: any)=>{
        if (!result.has(item.enroll_lot)) {
          let tmp: any[] = [] 
          tmp.push(item)
          result.set(item.enroll_lot, tmp)
        } else {
          let r = result.get(item.enroll_lot)
          r.push(item)

          var hash = {};
          r = r.reduce((item,next)=>{
            hash[next.enroll_age] ? '' : hash[next.enroll_age] = true && item.push(next);
            return item
          },[])

          result.set(item.enroll_lot, r)
        }
        return result
      }, new Map<String,any>());
      

      console.log(sors)
      const dimensions = ['2014','2015','2016','2017','2018']
      let measures: any[] = []
      for (let v of sors.values()){
        
        let index = 0;
        let vxx : String[] = v.map(item=>{
          return item.enroll_age
        })

        //从两个数组中找到不存在的
        let tmp : string[] = []
        

        for (let element of dimensions) {
          if (!vxx.includes(element)) {
            tmp.push(element)
          }
        }
        let lot = v[0].enroll_lot;
        let av = v[0].av_score === 0 ? v[0].high_score : v[0].av_score
        tmp.forEach(item=>{
          v.push({
            av_score: av,
            enroll_age: item,
            enroll_lot: lot
          })
        })

        v.sort((a: any,b: any)=>{
          const x = Number(a.enroll_age)
          const y = Number(b.enroll_age)
           if ( x > y){
             return 1
           } else if (x < y)  {
             return -1
           } else {
             return 0
           }
        })
        

        measures.push({data: v.map(item=>{
          return item.av_score === 0 ? item.high_score : item.av_score
        }),
        itemStyle: {
          normal: {
            // color: '#ff1'
          }
        }
      })
      }

      
      
      let yl = 0
      let yh = 0
      let ttt = measures.concat()
      
      ttt.forEach((item,index)=>{
        let tmp: any[] = item.data.concat()
        tmp.sort((a,b)=>{
          const x = Number(a)
          const y = Number(b)
          if (x >= y) {
            return 1
          } else {
            return -1
          }
        })
        if (index === 0) {
          yl = Number(tmp[0]) // 0是最小值 不给个默认的话 永远是从0开始无法进行比较
        }

        if (yl > Number(tmp[0])) {
          yl = Number(tmp[0])
        }

        if (yh < Number(tmp[tmp.length-1])) {
          yh = Number(tmp[tmp.length-1])
        }
      })

      this.currentScores = sors;
      const chartData = {
        areas: this.state.selectorChecked,
        dimensions: {
          data: dimensions,
        },
        measures: measures,
        yl:yl - 30,
        yh:yh + 30,
      }
      this.barChart.refresh(chartData);

    })
  }

  refreshSchool(){
    this.requestGaokao().then(res=>{
    console.log(res)
    const results : [] = res.data;
      results.forEach((item: any)=>{
        if (item.enroll_lot === '本科一批') {
          item.enroll_lot = '第一批'
        } else if (item.enroll_lot === '本科二批') {
          item.enroll_lot = '第二批'
        }
      })
      const sors = results.sort((a: any,b: any)=>{
        const x = Number(a.enroll_age)
        const y = Number(b.enroll_age)
         if ( x > y){
           return 1
         } else if (x < y)  {
           return -1
         } else {
           return 0
         }
      }).reduce((result, item: any)=>{
        if (!result.has(item.enroll_lot)) {
          let tmp: any[] = [] 
          tmp.push(item)
          result.set(item.enroll_lot, tmp)
        } else {
          let r = result.get(item.enroll_lot)
          r.push(item)

          var hash = {};
          r = r.reduce((item,next)=>{
            hash[next.enroll_age] ? '' : hash[next.enroll_age] = true && item.push(next);
            return item
          },[])

          result.set(item.enroll_lot, r)
        }
        return result
      }, new Map<String,any>());
      

      console.log(sors)
      const dimensions = ['2014','2015','2016','2017','2018']
      let measures: any[] = []
      for (let v of sors.values()){
        
        let index = 0;
        let vxx : String[] = v.map(item=>{
          return item.enroll_age
        })

        //从两个数组中找到不存在的
        let tmp : string[] = []
        

        for (let element of dimensions) {
          if (!vxx.includes(element)) {
            tmp.push(element)
          }
        }
        let lot = v[0].enroll_lot;
        let av = v[0].av_score
        tmp.forEach(item=>{
          v.push({
            av_score: av,
            enroll_age: item,
            enroll_lot: lot
          })
        })

        v.sort((a: any,b: any)=>{
          const x = Number(a.enroll_age)
          const y = Number(b.enroll_age)
           if ( x > y){
             return 1
           } else if (x < y)  {
             return -1
           } else {
             return 0
           }
        })
        

        measures.push({data: v.map(item=>{
          return item.av_score
        }),
        itemStyle: {
          normal: {
            // color: '#ff1'
          }
        }
      })
      }

      
      
      let yl = 0
      let yh = 0
      let ttt = measures.concat()
      
      ttt.forEach((item,index)=>{
        let tmp: any[] = item.data.concat()
        tmp.sort((a,b)=>{
          const x = Number(a)
          const y = Number(b)
          if (x >= y) {
            return 1
          } else {
            return -1
          }
        })
        if (index === 0) {
          yl = Number(tmp[0]) // 0是最小值 不给个默认的话 永远是从0开始无法进行比较
        }

        if (yl > Number(tmp[0])) {
          yl = Number(tmp[0])
        }

        if (yh < Number(tmp[tmp.length-1])) {
          yh = Number(tmp[tmp.length-1])
        }
      })

      this.currentScores = sors;
      const chartData = {
        areas: this.state.selectorChecked,
        dimensions: {
          data: dimensions,
        },
        measures: measures,
        yl:yl - 30,
        yh:yh + 30,
      }
      this.barChart.refresh(chartData);

    })
  }

  resreshArea(callback:()=>void){
    this.requestGaokao().then(res=>{
      
      const results : [] = res.data;
      const sors = results.sort((a: any,b: any)=>{
        const x = Number(a.enroll_age)
        const y = Number(b.enroll_age)
         if ( x > y){
           return 1
         } else if (x < y)  {
           return -1
         } else {
           return 0
         }
      }).reduce((result, item: any)=>{
        if (!result.has(item.enroll_lot)) {
          let tmp: any[] = [] 
          tmp.push(item)
          result.set(item.enroll_lot, tmp)
        } else {
          let r = result.get(item.enroll_lot)
          r.push(item)
          result.set(item.enroll_lot, r)
        }
        return result
      }, new Map<String,any>());

      console.log(sors)
     
      let a: any[] = []
      let measures: any[] = []
      for (let v of sors.values()){
        //找到v 长度最长的
        if (v.length >= a.length) {
          a = v;
        }
        measures.push({data: v.map(item=>{
          return item.low_score
        }),
        itemStyle: {
          normal: {
            // color: '#ff1'
          }
        }
      })
      }
      
      const dimensions = a.map(item=>{
        return item.enroll_age 
      })
      
      let yl = 0
      let yh = 0

      let ttt = measures.concat()
      
      ttt.forEach((item,index)=>{
        let tmp: any[] = item.data.concat()
        tmp.sort((a,b)=>{
          const x = Number(a)
          const y = Number(b)
          if (x >= y) {
            return 1
          } else {
            return -1
          }
        })
        if (index === 0) {
          yl = Number(tmp[0]) // 0是最小值 不给个默认的话 永远是从0开始无法进行比较
        }

        if (yl > Number(tmp[0])) {
          yl = Number(tmp[0])
        }

        if (yh < Number(tmp[tmp.length-1])) {
          yh = Number(tmp[tmp.length-1])
        }
      })
      this.currentScores = sors;
      const chartData = {
        areas: this.state.selectorChecked,
        dimensions: {
          data: dimensions,
        },
        measures: measures,
        yl:yl - 30,
        yh:yh + 30,
      }
      this.barChart.refresh(chartData);
      callback()
    }).catch(e => {
      console.log(e)
    })
  }

  pickerChanged = (e)=>{
    this.setState({
      selectorChecked: this.state.selector[e.detail.value]
    })
  }

  componentWillMount () { 
    console.log('mount')
  }



  componentDidMount () { 
    this.barChart.click((p)=>{
      console.log(p)
      //知道分数 dataIndex
      this.currentScores.forEach(item=>{
        console.log(item)
        let score = 0
        if(item.length <= p.dataIndex ) {
          return;
        }
        if(this.state.current === 0) {
          score = item[p.dataIndex].low_score
        } else {
          score = item[p.dataIndex].av_score
        }

        if(score === p.data) {
          this.setState({
            info:`${item[p.dataIndex].enroll_lot} ===> ${p.data}`,
          })
        }
      })
      
    })
  }

  refBarChart = (node) => this.barChart = node

  componentWillUnmount () { 
    console.log('unmount')
  }

  componentDidShow () { 
    console.log('didshow')
    const {school, major} = GKStore.getInstance()
    if (!school && !major) {
      return
    }
    
    this.setState({
      segValues: ['地区分数线查询', school ? school :'学校分数查询' , major ? major :'专业分数查询']
    })
  }

  componentDidHide () { }

  render () {
    // style={{display: 'flex', flexDirection: 'row'}}
    const {loading} = this.state;
    return (
      <View className='index' >
        <AtMessage />
        <View className='first'>
          
          <Picker className='picker' value={1} mode='selector' range={this.state.selector} onChange={this.pickerChanged}>
            <View >
                当前省份：{this.state.selectorChecked}
            </View>
          </Picker>
       
          <View style={{flexDirection: "row", justifyContent: 'center', textAlign: "center"}}>
            <Text style={{fontSize: 12, textAlign: "center"}} onClick={()=>{
              Taro.navigateTo({
                url: '/pages/search/search?type=School'
              })
            }} >
            [点击选择学校]
            </Text>

            <Text style={{flex: 1}} onClick={()=>{
              Taro.navigateTo({
                url: `/pages/search/search?type=Major&arts_li_ke=${this.state.wenliKe === 0 ?'文科' : '理科'}&area=${this.state.selectorChecked}`
              })
            }}>
              [点击选择专业]
             </Text> 
          </View>
          
          
        </View> 
        <AtSegmentedControl values={['文科', '理科']}
          onClick={this.handleWLClikc.bind(this)}
          current={this.state.wenliKe} /> 
        <AtSegmentedControl values={this.state.segValues}
        onClick={this.handleClick.bind(this)}
        current={this.state.current} />

        <View className="bar-chart" style={{position: "relative"}}>
          {loading?<AtActivityIndicator size={64} mode='center'></AtActivityIndicator>: null}
          <LineChart ref={this.refBarChart}  />
        </View>

        {/* <View className='at-row' style={{justifyContent:'center', alignItems:'center'}}>
          
    </View> */}
        
        <Text style={{color: '#ff5898'}}>{this.state.info}</Text> 
      </View>
    )
  }
}
