import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { addNetworkWindowSize, generateLines } from '../../actions';
import eventEmmiter from '../../utils/eventEmmiter';
import CanvasService from '../../services/CanvasService';
import { randomRange } from './../../helpers/helpersFunctions';

class Network extends Component {
    constructor(props) {
        super(props);
        this.state = {
            layoutWidth: 0,
            layoutHeight: 0,
        };
    }

    // life

    componentDidMount() {
        eventEmmiter.addListener('generateNodes', this.setSvgSizes);
        eventEmmiter.addListener('buildAlgorithm', this.buildAlgorthm);
    }

    componentWillReceiveProps(nextProps) {
        setTimeout(() => {
            this.renderNetwork(nextProps);
        }, 0);
    }

    componentWillUnmount() {
        eventEmmiter.removeEventListener('generateNodes');
    }

    setSvgSizes = () => {
        const {
            width,
            height,
        } = this.bodyRef.getBoundingClientRect();

        this.props.dispatch(addNetworkWindowSize(width, height));

        this.setState({
            layoutWidth: width,
            layoutHeight: height,
        });
    }

    // refs

    getNetworkBodyRef = (ref) => {
        this.bodyRef = ref;
    }

    getNetworkCanvas = (ref) => {
        this.canvasRef = ref;
    }

    // BASE ALGORITHM -----------------------

    // Получить точки которые входят в радиус действия определенной точки
    getRadiusNodes(nodes) {
        const nodesInRadius = [];

        for (let i = 0; i < nodes.length; i += 1) {
            const nearNodes = [];
            for (let j = 0; j < nodes.length; j += 1) {
                if (nodes[i].id !== nodes[j].id
                    && this.checkNodeInRadius(nodes[i].x, nodes[i].y, nodes[i].params.radius / 2, nodes[j].x, nodes[j].y)) {
                    nearNodes.push({
                        id: nodes[j].id,
                        x: nodes[j].x,
                        y: nodes[j].y,
                    });
                }
            }
            nodesInRadius.push({
                id: nodes[i].id,
                x: nodes[i].x,
                y: nodes[i].y,
                inRoute: false,
                nodesInRadius: nearNodes,
            });
        }

        return nodesInRadius;
    }

    buildAlgorthm = () => {
        this.opticsAlgorithm(this.props.nodes);
    }

    checkNodeInRadius(Xc, Yc, Rc, x, y) {
        return ((x - Xc) * (x - Xc) + (y - Yc) * (y - Yc)) < Rc * Rc;
    }

    distanceBetweenNodes(x0, x1, y0, y1) {
        return Math.sqrt(Math.pow(x0 - x1, 2) + Math.pow(y0 - y1, 2));
    }

    trianglePerimeter(x0, y0, x1, y1, x2, y2) {
        return this.distanceBetweenNodes(x0, x1, y0, y1)
                + this.distanceBetweenNodes(x0, x2, y0, y2)
                + this.distanceBetweenNodes(x1, x2, y1, y2);
    }

    // ALGORITHM ----------------------------

    // получить ребро для ближайшей точки в радиусе
    getLineForNearNode(node) {
        let minDistance = null;
        let nearNode = null;

        node.nodesInRadius.map((item) => {
            const distanceNow = this.distanceBetweenNodes(node.x, item.x, node.y, item.y);
            if (!minDistance || minDistance > distanceNow) {
                minDistance = distanceNow;
                nearNode = item;
            }
        });

        return {
            id1: node.id,
            id2: nearNode.id,
            x1: node.x,
            x2: nearNode.x,
            y1: node.y,
            y2: nearNode.y,
        };
    }

    getLineForMinimumPerimeter(prevLine, node) {
        let minPerimeter = null;
        let nearNode = null;

        node.nodesInRadius.map((item) => {
            const perimeterNow = this.trianglePerimeter(prevLine.x1, prevLine.y1, prevLine.x2, prevLine.y2, item.x, item.y);

            if ((!minPerimeter || minPerimeter > perimeterNow) && item.id !== prevLine.id1) {
                minPerimeter = perimeterNow;
                nearNode = item;
            }
        });

        return {
            id1: node.id,
            id2: nearNode.id,
            x1: node.x,
            x2: nearNode.x,
            y1: node.y,
            y2: nearNode.y,
        };
    }

    makeOpticsCluster(n) {
        const nodes = n;
        const lines = [];
        let line = null;
        let iterations = 0;

        // first line
        const randomNode = randomRange(0, nodes.length);
        if (!nodes[randomNode].inRoute) {
            nodes[randomNode].inRoute = true; // TODO 
            line = this.getLineForNearNode(nodes[randomNode]);
            iterations += 1;
        }

        console.log(line);
        
        lines.push(line);


        while (iterations !== nodes.length) {
            const nextItem = nodes.find((item) => {
                if (item.id === line.id2) {
                    iterations += 1;
                    return item;
                }
            });

            line = this.getLineForMinimumPerimeter(line, nextItem);
            lines.push(line);
        }

        return lines;


/*        const nodesWithLines = [];
        for (let i = 0; i < nodes.length; i += 1) {
            let minDistance = null;
            let minPerimeter = null;
            let firstLine = null;
            let secondLine = null;
            // Поиск точки с минимальным расстоянием
            for (let j = 0; j < nodes[i].nodesInRadius.length; j += 1) {
                const distance = this.distanceBetweenNodes(
                    nodes[i].x,
                    nodes[i].nodesInRadius[j].x,
                    nodes[i].y,
                    nodes[i].nodesInRadius[j].y,
                );

                if (!minDistance || minDistance > distance) {
                    minDistance = distance;
                    firstLine = {
                        id: nodes[i].nodesInRadius[j].id,
                        x1: nodes[i].x,
                        x2: nodes[i].nodesInRadius[j].x,
                        y1: nodes[i].y,
                        y2: nodes[i].nodesInRadius[j].y,
                    };
                }
            }
            // Поиск второй точки по минимальному периметру
            if (nodes[i].nodesInRadius.length > 1) {
                for (let k = 0; k < nodes[i].nodesInRadius.length; k += 1) {
                    if (firstLine.id !== nodes[i].nodesInRadius[k].id) {
                        const perim = this.trianglePerimeter(
                            firstLine.x1,
                            firstLine.y1,
                            firstLine.x2,
                            firstLine.y2,
                            nodes[i].nodesInRadius[k].x,
                            nodes[i].nodesInRadius[k].y,
                        );

                        if (!minPerimeter || minPerimeter > perim) {
                            minPerimeter = perim;
                            secondLine = {
                                id: nodes[i].nodesInRadius[k].id,
                                x1: nodes[i].x,
                                x2: nodes[i].nodesInRadius[k].x,
                                y1: nodes[i].y,
                                y2: nodes[i].nodesInRadius[k].y,
                            };
                        }
                    }
                }
            }
            nodesWithLines.push({
                id: nodes[i].id,
                lines: [firstLine, secondLine],
            });
        }
        return nodesWithLines;*/
    }

    getOpticsAlgorithmLines(nodes) {
        const nodesWithNearNodes = this.getRadiusNodes(nodes);

        const linesWithNodes = this.makeOpticsCluster(nodesWithNearNodes);

        console.log(linesWithNodes);

        const lines = [];

        // for (let i = 0; i < linesWithNodes.length; i += 1) {
        //     for (let j = 0; j < linesWithNodes[i].lines.length; j += 1) {
        //         if (linesWithNodes[i].lines[j]) {
        //             lines.push({
        //                 x1: linesWithNodes[i].lines[j].x1,
        //                 x2: linesWithNodes[i].lines[j].x2,
        //                 y1: linesWithNodes[i].lines[j].y1,
        //                 y2: linesWithNodes[i].lines[j].y2,
        //             });
        //         }
        //     }
        // }

        return linesWithNodes;
    }

    opticsAlgorithm = (nodes) => {
        this.props.dispatch(generateLines(this.getOpticsAlgorithmLines(nodes)));
    }

    // --------------------------------------

    // renders

    renderNetwork(nextProps) {
        const {
            nodes,
            mainNode,
            lines,
            showRange,
        } = nextProps;

        const {
            layoutWidth,
            layoutHeight,
        } = this.state;

        const canvas = this.canvasRef;
        const ctx = canvas.getContext('2d');

        CanvasService.clearCanvas(ctx, layoutWidth, layoutHeight);
        // all nodes
        CanvasService.renderNodes(ctx, nodes);
        // render radius
        if (showRange) CanvasService.renderNodesRadius(ctx, nodes);
        // main node
        CanvasService.renderMainNode(ctx, mainNode);
        // lines
        CanvasService.renderLines(ctx, lines);
    }

    render() {
        const {
            layoutWidth,
            layoutHeight,
        } = this.state;

        return (
            <div className="card network-layout rounded-0 flex-grow-1">
                <div className="card-body p-0 w-100 position-relative overflow-a" ref={this.getNetworkBodyRef}>
                    <canvas
                        className="position-absolute"
                        ref={this.getNetworkCanvas}
                        width={layoutWidth}
                        height={layoutHeight}
                    >
                    </canvas>
                </div>
            </div>
        );
    }
}

Network.propTypes = {
    dispatch: PropTypes.func,
    nodes: PropTypes.array,
    lines: PropTypes.array,
};

export default Network;

