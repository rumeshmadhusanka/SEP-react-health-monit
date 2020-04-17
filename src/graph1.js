import React from "react";
import Ring from "ringjs";

import {EventOut, percentile, Pipeline as pipeline, Stream, TimeEvent, TimeRange, TimeSeries} from "pondjs";

import ChartContainer from "react-timeseries-charts/lib/components/ChartContainer";
import ChartRow from "react-timeseries-charts/lib/components/ChartRow";
import Charts from "react-timeseries-charts/lib/components/Charts";
import YAxis from "react-timeseries-charts/lib/components/YAxis";
import LineChart from "react-timeseries-charts/lib/components/LineChart";
import AreaChart from "react-timeseries-charts/lib/components/AreaChart";
import BarChart from "react-timeseries-charts/lib/components/BarChart";
import TimeAxis from "react-timeseries-charts/lib/components/TimeAxis"
import Resizable from "react-timeseries-charts/lib/components/Resizable";
import Legend from "react-timeseries-charts/lib/components/Legend";
import styler from "react-timeseries-charts/lib/js/styler";

import realtime_docs from "react-timeseries-charts/README.md";
import realtime_thumbnail from "react-timeseries-charts/public/favicon.ico";
let Health = require('./health');

const sec = 1000;
const minute = 60 * sec;
const hours = 60 * minute;
const rate = 80;

class RealTimeGraph extends React.Component {
    static displayName = "AggregatorDemo";

    state = {
        time: new Date(2015, 0, 1),
        events: new Ring(200),
        percentile50Out: new Ring(100),
        percentile90Out: new Ring(100)
    };

    getNewEvent =  t => {
        const base = Math.sin(t.getTime() / 10000000) * 350 + 500;
        let health =  new Health();
        let cpu = (health.getData())['cpu'];
        console.log(cpu);

        return new TimeEvent(t, parseInt(base + Math.random() * 1000, 10));
    };

    // getNewEvent = t => {
    //     const base = Math.sin(t.getTime() / 10000000) * 350 + 500;
    //     return new TimeEvent(t, parseInt(base + Math.random() * 1000, 10));
    // };


    componentDidMount() {
        this.stream = new Stream();
        const increment = minute;

        this.interval = setInterval(() => {
            const t = new Date(this.state.time.getTime() + increment);
            const event = this.getNewEvent(t);



            // Raw events
            const newEvents = this.state.events;
            newEvents.push(event);
            this.setState({time: t, events: newEvents});

            // Let our aggregators process the event
            //this.stream.addEvent(event);
        }, rate);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    render() {
        const latestTime = `${this.state.time}`;
        const fiveMinuteStyle = {
            value: {
                normal: {fill: "#619F3A", opacity: 0.2},
                highlight: {fill: "619F3A", opacity: 0.5},
                selected: {fill: "619F3A", opacity: 0.5}
            }
        };

        const scatterStyle = {
            value: {
                normal: {
                    fill: "steelblue",
                    opacity: 0.5
                }
            }
        };

        //
        // Create a TimeSeries for our raw, 5min and hourly events
        //

        const eventSeries = new TimeSeries({
            name: "raw",
            events: this.state.events.toArray()
        });

        const perc50Series = new TimeSeries({
            name: "five minute perc50",
            events: this.state.percentile50Out.toArray()
        });

        const perc90Series = new TimeSeries({
            name: "five minute perc90",
            events: this.state.percentile90Out.toArray()
        });

        // Timerange for the chart axis
        const initialBeginTime = new Date(2015, 0, 1);
        const timeWindow = 3 * hours;

        let beginTime;
        const endTime = new Date(this.state.time.getTime() + minute);
        if (endTime.getTime() - timeWindow < initialBeginTime.getTime()) {
            beginTime = initialBeginTime;
        } else {
            beginTime = new Date(endTime.getTime() - timeWindow);
        }
        const timeRange = new TimeRange(beginTime, endTime);

        // Charts (after a certain amount of time, just show hourly rollup)
        const charts = (
            <Charts>
                <LineChart axis="y" series={eventSeries} style={scatterStyle} />
            </Charts>
        );

        const dateStyle = {
            fontSize: 12,
            color: "#AAA",
            borderWidth: 1,
            borderColor: "#F4F4F4"
        };

        const style = styler([
            {key: "perc50", color: "#C5DCB7", width: 1, dashed: true},
            {key: "perc90", color: "#DFECD7", width: 2}
        ]);

        return (
            <div>
                <div className="row">
                    <div className="col-md-4">
                        <Legend
                            type="swatch"
                            style={style}
                            categories={[
                                {
                                    key: "perc50",
                                    label: "50th Percentile",
                                    style: {fill: "#C5DCB7"}
                                },
                                {
                                    key: "perc90",
                                    label: "90th Percentile",
                                    style: {fill: "#DFECD7"}
                                }
                            ]}
                        />
                    </div>
                    <div className="col-md-8">
                        <span style={dateStyle}>{latestTime}</span>
                    </div>
                </div>
                <hr/>
                <div className="row">
                    <div className="col-md-12">
                        <Resizable>
                            <ChartContainer timeRange={timeRange}>
                                <ChartRow height="150">
                                    <YAxis
                                        id="y"
                                        label="Value"
                                        min={0}
                                        max={1500}
                                        width="70"
                                        type="linear"
                                    />
                                    {charts}
                                </ChartRow>
                            </ChartContainer>
                        </Resizable>
                    </div>
                </div>
            </div>
        );
    }
}

// Export example
export default RealTimeGraph;