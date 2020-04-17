import React from "react";

import {EventOut, percentile, Pipeline as pipeline, Stream, TimeEvent, TimeRange, TimeSeries, Index} from "pondjs";

import ChartContainer from "react-timeseries-charts/lib/components/ChartContainer";
import ChartRow from "react-timeseries-charts/lib/components/ChartRow";
import Charts from "react-timeseries-charts/lib/components/Charts";
import YAxis from "react-timeseries-charts/lib/components/YAxis";
import LineChart from "react-timeseries-charts/lib/components/LineChart";
import ScatterChart from "react-timeseries-charts/lib/components/ScatterChart";
import BarChart from "react-timeseries-charts/lib/components/BarChart";
import Resizable from "react-timeseries-charts/lib/components/Resizable";
import Legend from "react-timeseries-charts/lib/components/Legend";
import styler from "react-timeseries-charts/lib/js/styler";

import data from "./data";
import Ring from "ringjs";



const sec = 1000;
const minute = 60 * sec;
const hours = 60 * minute;
const rate = 80;




class RealTimeGraph extends React.Component {
    static displayName = "Demo";

    state = {
        time: new Date(2015, 0, 1),
        events: new Ring(200),
        percentile50Out: new Ring(100),
        percentile90Out: new Ring(100)
    };
    getNewEvent = t => {
        const base = Math.sin(t.getTime() / 10000000) * 350 + 500;
        return new TimeEvent(t, parseInt(base + Math.random() * 1000, 10));
    };
    componentDidMount() {
        //
        // Setup our aggregation pipelines
        //

        this.stream = new Stream();

        pipeline()
            .from(this.stream)
            .windowBy("5m")
            .emitOn("discard")
            .aggregate({
                value: {value: percentile(90)}
            })
            .to(EventOut, event => {
                const events = this.state.percentile90Out;
                events.push(event);
                this.setState({percentile90Out: events});
            });

        pipeline()
            .from(this.stream)
            .windowBy("5m")
            .emitOn("discard")
            .aggregate({
                value: {value: percentile(50)}
            })
            .to(EventOut, event => {
                const events = this.state.percentile50Out;
                events.push(event);
                this.setState({percentile50Out: events});
            });

        //
        // Setup our interval to advance the time and generate raw events
        //

        const increment = minute;
        this.interval = setInterval(() => {
            const t = new Date(this.state.time.getTime() + increment);
            const event = this.getNewEvent(t);

            // Raw events
            const newEvents = this.state.events;
            newEvents.push(event);
            this.setState({time: t, events: newEvents});

            // Let our aggregators process the event
            this.stream.addEvent(event);
        }, rate);
    }
    componentWillUnmount() {
        clearInterval(this.interval);
    }




    render() {
        const series = new TimeSeries({
            name: "hilo_rainfall",
            columns: ["index", "precip"],
            points: data.values.map(([d, value]) => [
                Index.getIndexString("1h", new Date(d)),
                value
            ])
        });

        console.log("series is ", series);
        const style = styler([
            {
                key: "precip",
                color: "#A5C8E1",
                selected: "#2CB1CF"
            }
        ]);

        return (
            <Resizable>
                <ChartContainer timeRange={series.range()}>
                    <ChartRow height="150">
                        <YAxis
                            id="rain"
                            label="Rainfall (inches/hr)"
                            min={0}
                            max={2}
                            format=".2f"
                            width="70"
                            type="linear"
                        />
                        <Charts>
                            <BarChart
                                axis="rain"
                                style={style}
                                spacing={1}
                                columns={["precip"]}
                                series={series}
                                minBarHeight={1}
                            />
                        </Charts>
                    </ChartRow>
                </ChartContainer>
            </Resizable>
        );
    }
}

export default RealTimeGraph;
