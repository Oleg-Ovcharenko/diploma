import {
    NODE_RADIUS,
    NODE_COLOR,
    MAIN_NODE_COLOR,
    MAIN_NODE_RADIUS,
} from '../constants';

class Animations {
    static clearCanvas(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
    }

    static renderNodes(ctx, nodes) {
        nodes.forEach((node) => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, NODE_RADIUS / 2, 2 * Math.PI, false);
            ctx.fillStyle = NODE_COLOR;
            ctx.fill();
        });
    }

    static renderMainNode(ctx, mainNode) {
        ctx.beginPath();
        ctx.arc(mainNode.x, mainNode.y, MAIN_NODE_RADIUS / 2, 0, 2 * Math.PI, false);
        ctx.fillStyle = MAIN_NODE_COLOR;
        ctx.fill();
    }

    static renderLines(ctx, lines) {
        lines.forEach((line) => {
            ctx.beginPath();
            ctx.moveTo(line.x1, line.y1);
            ctx.lineWidth = 1;
            ctx.strokeStyle = NODE_COLOR;
            ctx.lineTo(line.x2, line.y2);
            ctx.stroke();
        });
    }

    static renderNodesRadius(ctx, nodes) {
        nodes.forEach((node) => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.params.radius / 2, 2 * Math.PI, false);
            ctx.strokeStyle = '#e9ecef';
            ctx.stroke();
        });
    }
}

export default Animations;

