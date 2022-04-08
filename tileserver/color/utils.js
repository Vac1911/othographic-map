const d2h = d => d.toString(16).padEnd(2, '0'); // convert a decimal value to hex
const h2d = h => parseInt(h, 16); // convert a hex value to decimal
module.exports = {
    mix: function (color_1, color_2, weight) {
        weight = (typeof (weight) !== 'undefined') ? weight : 50; // set the weight to 50%, if that argument is omitted
        var color = "#";
        for (var i = 0; i <= 5; i += 2) { // loop through each of the 3 hex pairs—red, green, and blue
            var v1 = h2d(color_1.substr(i, 2)), // extract the current pairs
            v2 = h2d(color_2.substr(i, 2)), 
            // combine the current pairs from each source color, according to the specified weight
            val = d2h(Math.floor(v2 + (v1 - v2) * (weight / 100.0)));
            while (val.length < 2) {
                val = '0' + val;
            } // prepend a '0' if val results in a single digit
            color += val; // concatenate val to our new color string
        }
        return color; // PROFIT!
    },
    bitValue: function (h, s, l) {
        return this.rgb2hex(...this.hsl2rgb(h * 360, s, l).map(n => Math.floor(n)));
    },
    rgb2hex: function (r, g, b) {
        return `#${d2h(r)}${d2h(g)}${d2h(b)}`;
    },
    /**
     * Converts an HSL color value to RGB. Conversion formula
     * adapted from https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_RGB_alternative.
     * @param h
     * @param s
     * @param l
     * @returns {[*, *, *]}
     */
    hsl2rgb: function (h, s, l) {
        let a = s * Math.min(l, 1 - l);
        let f = (n, k = (n + h / 30) % 12) => l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return [f(0) * 255, f(8) * 255, f(4) * 255];
    }
};
