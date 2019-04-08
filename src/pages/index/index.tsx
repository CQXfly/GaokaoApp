import Taro, { Component, Config, request } from '@tarojs/taro'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import './index.scss'
import { Net } from '../../Utils/GKNet'

import BarChart from '../../components/BarChart'
import LineChart from '../../components/LineChart'

import { AtButton, AtSegmentedControl } from 'taro-ui'
import { any } from 'prop-types';



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

  constructor() {
    super(...arguments)
    this.state={
      current: 0,
    }
  }

  handleClick (value) {
    this.setState({
      current: value
    })
  }

  requestGaokao() {
    const p = new Promise<any>((res,rej)=>{
      Taro.request({
          url: 'https://time-machine-firefox.cn',
          data: {
              type: 'areaScore',
              area: '江苏',
          },
          success: (r)=>{
              res(r)
          },
          fail: (e) => {
            rej(e)
          }
          
      })   
   })
   return p
  }

  componentWillMount () { 
    
  }

  componentDidMount () { 
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
      }).filter((item: any)=>{
        return item.enroll_lot === results[0].enroll_lot
      })

      console.log(sors)
      const dimensions = sors.map(item=>{
        return item.enroll_age 
      })

      const measures = sors.map(item=>{
        return item.low_score
      })

      const chartData = {
        dimensions: {
          data: dimensions,
        },
        measures: [{
          name: 'title',
          data: measures
        }, {
          name : '123',
          data: measures.map(item=>{
            return item + 10
          })
        }]
      }
      this.barChart.refresh(chartData);

    }).catch(e => {
      console.log(e)
    })
    
  }

  refBarChart = (node) => this.barChart = node

  componentWillUnmount () { }

  componentDidShow () { }

  componentDidHide () { }

  render () {
    // style={{display: 'flex', flexDirection: 'row'}}
    return (
      <View className='index' >
        <AtSegmentedControl values={['地区分数线查询', '学校分数查询', '专业分数查询']}
        onClick={this.handleClick.bind(this)}
        current={this.state.current} />

        <View className="bar-chart">
          <LineChart ref={this.refBarChart} />
        </View>

        {/* <View className='at-row' style={{justifyContent:'center', alignItems:'center'}}>
          
        </View>
        
        <Text style={{color: '#ff5898'}}>asdaas</Text> */}
      </View>
    )
  }
}
