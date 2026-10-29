# Mokti website demos

Three fictional demo businesses that show clients what their site could do:
`salon/` (Gulmohar), `boutique/` (Neelkamal) and `clinic/` (Sukoon). `index.html`
is the Mokti page that presents them. Every demo page has `noindex`, a
"Fictional demo" bar at the top and a fictional-business line in the footer.

## How a demo is built

- `kit/demo.css` holds every layout and component. A demo picks its look with
  the variables in its `<style>` block: colours, the two fonts and corner radius.
- `kit/demo.js` runs the menu, reveals, "Book" buttons that fill in the form
  (`data-fill="service=Haircut|stylist=Meera"`), filter chips
  (`<div class="chips" data-filter=".item">` with `data-tags` on each item),
  opening hours with an "Open now" status (`data-hours` on `table.hours`), and
  the boutique's product dialog, sizes, bag and WhatsApp order text
  (`window.DEMO_SHOP`).
- Illustrations are small SVG files in each `img/` folder. `previews/` holds the
  screenshots used on the demos page.

## Turning a demo into a client site

1. Copy the demo folder into a new project, with `kit/`.
2. Change the theme variables, business name, text, prices and photos.
3. Remove the demo bar and the fictional-business footer line, and drop `noindex`.
4. Make the forms real: remove `data-demo-form`, add `name="..."` and
   `data-netlify="true"` to the form (Netlify Forms), or point the WhatsApp
   order at the shop's number with `https://wa.me/<number>?text=...`.
