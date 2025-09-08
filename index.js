import express from "express";
import { engine } from 'express-handlebars'; 
import path from "path";
import bodyParser from 'body-parser';

const app = express();
const port = 3000;

app.engine('handlebars', engine({
    defaultLayout: 'main',
    partialsDir: path.resolve('views/partials'),
    helpers: { eq: (a, b) => a === b }
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.resolve('public')));
app.set('view engine', 'handlebars');
app.set('views', path.resolve('views'));

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/cardapio", (req, res) => {
    res.render("cardapio");
});

app.post("/pedido", (req, res) => {
    const { sabores = [], tamanho, borda, adicionais = [], total } = req.body;
    
    // Ensure arrays are properly handled (Express might send single values as strings)
    const saboresArray = Array.isArray(sabores) ? sabores : [sabores].filter(Boolean);
    const adicionaisArray = Array.isArray(adicionais) ? adicionais : [adicionais].filter(Boolean);
    
    // Render the pedido template with the order data
    res.render("pedido", {
        sabores: saboresArray,
        tamanho: tamanho || 'Não selecionado',
        borda: borda || 'Sem Borda',
        adicionais: adicionaisArray,
        total: total || '0.00'
    });
});

app.listen(port, () => {
    console.log(`🚀 Pizzaria MucaRoela rodando em http://localhost:${port}`);
});