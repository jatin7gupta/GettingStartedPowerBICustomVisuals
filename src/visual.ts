/*
 *  Power BI Visual CLI
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

module powerbi.extensibility.visual {
    export interface TestItem {
        Country: string;
        Amount: number;
    }
    "use strict";
    export class Visual implements IVisual {
        private settings: VisualSettings;
        private svg: d3.Selection<SVGElement>;
        private g: d3.Selection<SVGElement>;
        private margin = { top: 20, right: 20, bottom: 200, left: 70 };
        constructor(options: VisualConstructorOptions) {
            // append svg into the visual element
            this.svg = d3.select(options.element).append('svg');
            this.g = this.svg.append('g');
        }

        public update(options: VisualUpdateOptions) {
            this.settings = Visual.parseSettings(options &&
                -                options.dataViews && options.dataViews[0]);
            let _this = this;

            // get height and width from viewport
            _this.svg.attr({
                height: options.viewport.height,
                width: options.viewport.width
            });
            let gHeight = options.viewport.height
                - _this.margin.top
                - _this.margin.bottom;
            let gWidth = options.viewport.width
                - _this.margin.right
                - _this.margin.left;
            _this.g.attr({
                height: gHeight,
                width: gWidth
            });
            _this.g.attr('transform',
                `translate(${ _this.margin.left}, ${ _this.margin.top})`);

            // convert data format
            let dat = Visual.converter(options);

            // setup d3 scale
            let xScale = d3.scale.ordinal()
                .domain(dat.map( (d)=> { return d.Country; }))
                .rangeRoundBands([0, gWidth], 0.1);
            let yMax =
                d3.max(dat,  (d)=> { return d.Amount + 10 });
            let yScale = d3.scale.linear()
                .domain([0, yMax])
                .range([gHeight, 0]);

            // remove existing axis and bar
            _this.svg.selectAll('.axis').remove();
            _this.svg.selectAll('.bar').remove();

            // draw x axis
            let xAxis = d3.svg.axis()
                .scale(xScale)
                .orient('bottom');
            _this.g
                .append('g')
                .attr('class', 'x axis')
                .style('fill', 'black')
                .attr('transform', `translate(0, ${(gHeight - 1)})`)
                .call(xAxis)
                .selectAll('text') // rotate text
                .style('text-anchor', 'end')
                .attr('dx', '-.8em')
                .attr('dy', '-.6em')
                .attr('transform', 'rotate(-90)');

            // draw y axis
            let yAxis = d3.svg.axis()
                .scale(yScale)
                .orient('left');
            _this.g
                .append('g')
                .attr('class', 'y axis')
                .style('fill', 'black')
                .call(yAxis);

            // draw bar
            let shapes = _this.g
                .append('g')
                .selectAll('.bar')
                .data(dat);

            shapes.enter()
                .append('rect')
                .attr('class', 'bar')
                .attr('fill', 'yellow')
                .attr('stroke', 'black')
                .attr('x', (d) => {
                    return xScale(d.Country);
                })
                .attr('width', xScale.rangeBand())
                .attr('y', (d)=> {
                    return yScale(d.Amount);
                })
                .attr('height',(d) => {
                    return gHeight - yScale(d.Amount);
                });

            shapes
                .exit()
                .remove();
        }

        private static parseSettings(dataView: DataView): VisualSettings {
            return VisualSettings.parse(dataView) as VisualSettings;
        }

        public static converter(options: VisualUpdateOptions): TestItem[] {
            let rows = options.dataViews[0].table.rows;
            let resultData: TestItem[] = [];
            //convert from ['x', y] to [{"x":x, "y": y}]
            for (let i = 0;i < rows.length;i++) {
                let row = rows[i];
                resultData.push({
                    Country: row[0].toString(),
                    Amount: +row[1]
                });
            }
            return resultData;
        }

        /** 
         * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the 
         * objects and properties you want to expose to the users in the property pane.
         * 
         */
        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
            return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
        }
    }
}