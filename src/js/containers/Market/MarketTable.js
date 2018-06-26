import React from "react"
import { connect } from "react-redux"

import ReactTable from 'react-table'
//import "react-table/react-table.css";
import { getTranslate } from 'react-localize-redux'
import * as actions from "../../actions/marketActions"
import * as converters from "../../utils/converter"

import LineChart from 'react-linechart';
import {Line} from 'react-chartjs-2';
//import '../node_modules/react-linechart/dist/styles.css';


@connect((store) => {
  var searchWord = store.market.configs.searchWord
  if (typeof searchWord === "undefined") searchWord = ""

  var currency = store.market.configs.currency.focus
  var tokens = store.market.tokens
  var data = []
  Object.keys(tokens).forEach((key) => {
    if (key === "ETH") return
    if ((key !== "") && !key.toLowerCase().includes(searchWord.toLowerCase())) return

    var item = tokens[key]
    item.market = key + ' / ' + currency
    item = { ...item, ...item[currency] }
    data.push(item)
  })
  return {
    translate: getTranslate(store.locale),
    searchWord,
    currency,
    sort: store.market.configs.sort.focus,
    displayColumn: store.market.configs.column.display.active,
    showActive: store.market.configs.column.shows.active,
    listShowColumn: store.market.configs.column.shows.listItem,
    data: data,
    tokens: tokens
  }
})

export default class MarketTable extends React.Component {
  drawChart = (props) => {
    var lineColor = ""
    var backgroundColor = ""
    if (props["original"]["change"] < 0) {
      lineColor = "#EB7576"
      backgroundColor = "#F6EAEC"
    } else if (props["original"]["change"] === 0) {
      lineColor = "#767677"
      backgroundColor = "#eee"
    } else {
      lineColor = "#1FDCAB"
      backgroundColor = "#EDFBF6"
    }
    var point = []
    var labels = []
    var input = props.value
    if (Array.isArray(input)) {
      input.map((item, index) => {
        labels.push(index)
        point.push(item)
      })
  
      var data = {
        labels: labels,
        datasets: [{
          data: point,
          backgroundColor: backgroundColor,
          fill: true,
          borderColor: lineColor,
          borderWidth: 1.2
        }]
      }
    } else {
      return (
        <div></div>
      )
    }
    
    var options = {
      elements: {
        point: {
          radius: 0
        }
      },
      legend: {
        display: false
      },
      scales: { 
        xAxes: [{ 
          display: false,
          gridLines: {
            display:false
          }
        }],
        yAxes: [{
          display: false,
          gridLines: {
            display:false
          }
        }]
      }
    } 
    return (
      <Line 
        width={200}
        height={70}
        data={data}
        options={options}
        hideXAxis = {true}
        hideYAxis = {true}
        hidePoints = {true}
  		/>
    )
  }
  addClassChange = (input) => {
    if (input < 0) {
      return (
        <span className = "negative">{input} %<img src={require("../../../assets/img/landing/arrow_red.svg")}/></span>
      )
    } else if (input === 0){
      return (
        <span className = "zero-value">{input} %</span>
      )
    } else {
      return (
        <span className = "positive">{input} %<img src={require("../../../assets/img/landing/arrow_green.svg")}/></span>
      )
    }
  }
  formatNumber = (number) => {
    if (number > 1000) {
      return converters.formatNumber(number)
    }
    return number
  }

  addUnit = (input, currency) => {
    return (
      <span>{this.formatNumber(input)} {currency}</span>
    )
  }
  
  getSortHeader = (title, key) => {
    return (
      <div className="rt-th-img">
        <img src={require("../../../assets/img/landing/sort.svg")} />{this.props.translate("market." + key) || title}
      </div>
    )
  }

  addIcon = (input) => {
    var tokenPair = input.split(" / ")
    var key = tokenPair[0]
    return (
      <div className="token-pair">
        <img src={require("../../../assets/img/tokens/" + this.props.tokens[key].info.icon)} />
        {input}
      </div>
    )
  } 

  getColumn = () => {
    var columns = [{
      Header: this.getSortHeader(this.props.translate("market.market") || "Market"),
      accessor: 'market', // String-based value accessors!
      Cell: props => this.addIcon(props.value),
      minWidth: 175
    }, {
      Header: this.getSortHeader(this.props.translate("market.sell_price") || "Sell Price"),
      accessor: 'sellPrice',
      Cell: props => this.addUnit(props.value, this.props.currency),
      minWidth: 150
    }, {
      Header: this.getSortHeader(this.props.translate("market.buy_price") || "Buy Price"), // Required because our accessor is not a string
      accessor: 'buyPrice',
      Cell: props => this.addUnit(props.value, this.props.currency),
      minWidth: 150
    }]
    Object.keys(this.props.listShowColumn).map((key, i) => {
      var item = this.props.listShowColumn[key]
      var index = this.props.showActive.indexOf(key)
      if (index !== -1) {
        switch (item.type){
          case "chart":{
            if (this.props.currency != "USD") {
              columns.push({
                Header: item.title,
                accessor: key,
                Cell: props => this.drawChart(props),
                sortable: false,
                maxWidth: 200,
                minWidth: 150,
                height: 70
              })            
            }
            break
          }
          default: {
            switch (key) {
              case "change": {
                columns.push({
                  Header: this.getSortHeader(item.title, key),
                  accessor: key,
                  Cell: props => this.addClassChange(props.value),
                  minWidth: 200
                })
                break
              }
              case "circulating_supply":{
                columns.push({
                  Header: this.getSortHeader(item.title, key),
                  accessor: key,
                  Cell: props => this.formatNumber(props.value),
                  minWidth: 200
                })
                break
              }
              case "total_supply":{
                columns.push({
                  Header: this.getSortHeader(item.title, key),
                  accessor: key,
                  Cell: props => this.formatNumber(props.value),
                  minWidth: 150
                })
                break
              }
              case "market_cap":{
                columns.push({
                  Header: this.getSortHeader(item.title, key),
                  accessor: key,
                  Cell: props => this.addUnit(props.value, this.props.currency),
                  minWidth: 150
                })
                break
              }
              case "volume": {
                columns.push({
                  Header: this.getSortHeader(item.title, key),
                  accessor: key,
                  Cell: props => this.addUnit(props.value, this.props.currency),
                  minWidth: 150
                })
                break
              }
              case "circulating_supply": {
                columns.push({
                  Header: this.getSortHeader(item.title, key),
                  accessor: key,
                  minWidth: 200
                })
                break
              }
              default: {
                columns.push({
                  Header: this.getSortHeader(item.title, key),
                  accessor: key,
                  minWidth: 150
                })
                break
              }
            }
            break
          }
        }
      }
    })
    return columns
  }


  render() {
    const columns = this.getColumn()

    return (
      <ReactTable
        data={this.props.data}
        columns={columns}
        getTrProps={(state, rowInfo) => {
          return {
            onClick: (e) => {
              var symbol = rowInfo.original.info.symbol
              this.props.dispatch(actions.showTradingViewChart(symbol))
            }
          }
        }
        }
        getPaginationProps={() => {
          return {
            previousText: (<img src={require("../../../assets/img/market/arrow-left.png")} />),
            nextText:  (<img src={require("../../../assets/img/market/arrow-right.svg")} />)
          }
        }
        }
      />
    )
  }
}
