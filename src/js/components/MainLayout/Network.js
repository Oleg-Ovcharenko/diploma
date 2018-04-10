import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { addNetworkWindowSize, generateLines } from '../../actions';
import eventEmmiter from '../../utils/eventEmmiter';
import CanvasService from '../../services/CanvasService';

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
    }

    componentWillReceiveProps(nextProps) {
        if (!this.props.nodes[0] || nextProps.nodes[0].x !== this.props.nodes[0].x) { // TODO
            setTimeout(() => {
                this.renderNetwork(nextProps);
            }, 0);
        }

        if (this.props.startAlgorithm !== nextProps.startAlgorithm) { // TODO
            this.opticsAlgorithm(nextProps.nodes);
        }

        if (this.props.lines.length === 0 && nextProps.lines.length) { // TODO
            setTimeout(() => {
                this.renderNetwork(nextProps);
            }, 0);
        }
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
    /* growNode = (node) => {
        const canvas = this.canvasRef;
        const ctx = canvas.getContext('2d');

        let i = 0;
        function animate() {
            ctx.save();
            ctx.clearRect(0, 0, ctx.width, ctx.height);

            if (i > node.params.radius) {
                i = 1;
            }

            if (i > 40) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, i / 2, 0, 2 * Math.PI, false);
                ctx.fillStyle = 'rgba(41,118,196,.2)';
                ctx.fill();
            }
            i += 1;
            ctx.restore();
            setTimeout(animate, 10);
        }

        animate();
    } */

    // BASE ALGORITHM -----------------------

    // Получить точки которые входят в радиус действия определенной точки
    getRadiusNodes(nodes) {
        const nodesInRadius = [];
        for (let i = 0; i < nodes.length; i += 1) {
            const nearNodes = [];
            for (let j = 0; j < nodes.length; j += 1) {
                if (nodes[i].id !== nodes[j].id
                    && this.checkNodeInRadius(nodes[j].x, nodes[j].y, nodes[j].params.radius, nodes[i].x, nodes[i].y)) {
                    nearNodes.push({
                        id: nodes[j].id,
                        x: nodes[j].x,
                        y: nodes[j].y,
                    })
                }
            }
            nodesInRadius.push({
                id: nodes[i].id,
                x: nodes[i].x,
                y: nodes[i].y,
                nodesInRadius: nearNodes,
            })
        }

        return nodesInRadius;
    }

    checkNodeInRadius(x0, y0, r, x1, y1) {
        return Math.sqrt(((x0 - x1) * (x0 - x1)) + ((y0 - y1) * (y0 - y1))) <= r;
    }

    
    distanceBetweenNodes(x0, x1, y0, y1) {
        return Math.sqrt(Math.pow(x0 - x1) + Math.pow(y0 - y1));
    }

    trianglePerimeter(x0, y0, x1, y1, x2, y2) {
        return this.distanceBetweenNodes(x0, x1, y0, y1)
                + this.distanceBetweenNodes(x0, x2, y0, y2)
                + this.distanceBetweenNodes(x1, x2, y1, y2);
    }

    // ALGORITHM ----------------------------

    makeOpticsCluster(nodes) {
        let nodesWithLines = [];
        for (let i = 0; i < nodes.length; i++) {
            let minDistance = null;
            let minPerimeter = null;
            let lines = [];
            let firstLine = null;
            let secondLine = null;
            // Поиск точки с минимальным расстоянием
            for (let j = 0; j < nodes[i].nodesInRadius.length; j++) {
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
                    }
                }
            }
            // Поиск второй точки по минимальному периметру
            if (nodes[i].nodesInRadius.length > 1) {
                for (let k = 0; k < nodes[i].nodesInRadius.length; k++) {
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
            })
        }
        return nodesWithLines;
    }

    opticsAlgorithm = (nodes) => {
        const nodesWithNearNodes = this.getRadiusNodes(nodes);
        const linesWithNodes = this.makeOpticsCluster(nodesWithNearNodes);
        const lines = [];

        for (let i = 0; i < linesWithNodes.length; i++) {
            for (let j = 0; j < linesWithNodes[i].lines.length; j++) {
                if (linesWithNodes[i].lines[j]) {
                    lines.push({
                        x1: linesWithNodes[i].lines[j].x1,
                        x2: linesWithNodes[i].lines[j].x2,
                        y1: linesWithNodes[i].lines[j].y1,
                        y2: linesWithNodes[i].lines[j].y2,
                    })
                }
            }
        }

        this.props.dispatch(generateLines(lines));
    }

    // --------------------------------------

    // renders

    renderNetwork(nextProps) {
        const {
            nodes,
            mainNode,
            lines,
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
    startAlgorithm: PropTypes.bool,
    nodes: PropTypes.array,
    lines: PropTypes.array,
};

export default Network;

