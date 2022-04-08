import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { styleMap } from 'lit/directives/style-map.js';

@customElement("layer-display")
export class LayerDisplay extends LitElement {
    // Styles are scoped to this element: they won't conflict with styles
    // on the main page or in other components. Styling API can be exposed
    // via CSS custom properties.
    static styles = css`
    :host {
        display: flex;
        justify-content: center;
    }

    .wrapper {
        display: flex;
        flex-direction: column;
        background: var(--bs-gray-dark);
        padding: 0.5rem;
        gap: 0.5rem;
    }

    .grid {
        display: grid;
        width: 85vh;
        height: 85vh;
    }
    .tile {
        display: block;
        line-height: 0;
    }

    .tile img {
        width: 100%;
    }
  `;


    @property({ type: Number })
    zoom: number;

    @property({ type: String })
    endpoint: string;

    @state()
    protected showGrid = true;

    tileUrl(x: number, y: number) {
        return this.endpoint
            .replace('{X}', x.toString())
            .replace('{Y}', y.toString())
            .replace('{Z}', this.zoom.toString())
    }

    get sideLength() {
        return 2 ** this.zoom;
    }

    renderTiles() {
        const tiles: any[] = [];
        for (const y in [...Array(this.sideLength).keys()]) {
            for (const x in [...Array(this.sideLength).keys()]) {
                // tiles.push(html``);
                tiles.push(html`<div class="tile"><img src="${this.tileUrl(parseInt(x), parseInt(y))}" alt="(${x}, ${y})"></div>`);
            }
        }
        return tiles;
    }

    setZoom(ev) {
        this.zoom = ev.target.value;
    }

    render() {
        const gridStyles = {
            'grid-template-rows': `repeat(${this.sideLength}, 1fr)`,
            'grid-template-columns': `repeat(${this.sideLength}, 1fr)`,
            'gap': this.showGrid ? '2px' : '0'
        };
        return html`
            <div class="wrapper">
                <input type="number" .value=${live(this.zoom.toString())} min="0" @change=${this.setZoom} />
                <div>
                    <span>Zoom Level: ${this.zoom}</span>
                </div>
                <div class="grid" style="${styleMap(gridStyles)}">${this.renderTiles()}</div>
            </div>
        `;
    }
}
