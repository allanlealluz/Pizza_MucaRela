import express from "express";
import { engine } from 'express-handlebars'; 
import path from "path";
import bodyParser from 'body-parser';

const app = express();
const port = 3000;

app.engine('handlebars', engine({
    defaultLayout: 'main',
    partialsDir: path.resolve('views/partials'),
    helpers: { eq: (a, b) => a === b, json: (context) => JSON.stringify(context)  }
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.resolve('public')));
app.set('view engine', 'handlebars');
app.set('views', path.resolve('views'));

const bebidas = [
    { id: 1, nome: 'Coca-Cola 350ml', preco: 4.50, categoria: 'Refrigerante' },
    { id: 2, nome: 'Coca-Cola 600ml', preco: 6.50, categoria: 'Refrigerante' },
    { id: 3, nome: 'Guaraná Antarctica 350ml', preco: 4.00, categoria: 'Refrigerante' },
    { id: 4, nome: 'Guaraná Antarctica 600ml', preco: 6.00, categoria: 'Refrigerante' },
    { id: 5, nome: 'Fanta Laranja 350ml', preco: 4.00, categoria: 'Refrigerante' },
    { id: 6, nome: 'Sprite 350ml', preco: 4.00, categoria: 'Refrigerante' },
    { id: 7, nome: 'Água Mineral 500ml', preco: 2.50, categoria: 'Água' },
    { id: 8, nome: 'Água com Gás 500ml', preco: 3.00, categoria: 'Água' },
    { id: 9, nome: 'Suco de Laranja 300ml', preco: 5.50, categoria: 'Suco Natural' },
    { id: 10, nome: 'Suco de Uva 300ml', preco: 5.50, categoria: 'Suco Natural' },
    { id: 11, nome: 'Cerveja Skol Lata 350ml', preco: 3.50, categoria: 'Cerveja' },
    { id: 12, nome: 'Cerveja Brahma Lata 350ml', preco: 3.50, categoria: 'Cerveja' },
    { id: 13, nome: 'Cerveja Heineken Lata 350ml', preco: 5.00, categoria: 'Cerveja' }
];

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/cardapio", (req, res) => {
    res.render("cardapio");
});
app.get("/bebidas", (req, res) => {

    const bebidasPorCategoria = bebidas.reduce((acc, bebida) => {
        if (!acc[bebida.categoria]) {
            acc[bebida.categoria] = [];
        }
        acc[bebida.categoria].push(bebida);
        return acc;
    }, {});
    res.render("bebidas", { 
        bebidasPorCategoria,
        bebidas
    });
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
app.post("/pedido-completo", (req, res) => {
    const { 
        sabores = [], 
        tamanho, 
        borda, 
        adicionais = [], 
        totalPizza,
        bebidas: bebidasSelecionadas = [],
        quantidades = [],
        totalBebidas,
        totalGeral
    } = req.body;
    
    // Ensure arrays are properly handled
    const saboresArray = Array.isArray(sabores) ? sabores : [sabores].filter(Boolean);
    const adicionaisArray = Array.isArray(adicionais) ? adicionais : [adicionais].filter(Boolean);
    const bebidasArray = Array.isArray(bebidasSelecionadas) ? bebidasSelecionadas : [bebidasSelecionadas].filter(Boolean);
    const quantidadesArray = Array.isArray(quantidades) ? quantidades : [quantidades].filter(Boolean);
    
    // Processar bebidas selecionadas
    const bebidasPedido = bebidasArray.map((bebidaId, index) => {
        const bebida = bebidas.find(b => b.id === parseInt(bebidaId));
        const quantidade = parseInt(quantidadesArray[index]) || 1;
        return {
            ...bebida,
            quantidade,
            subtotal: (bebida.preco * quantidade).toFixed(2)
        };
    });
    
    res.render("pedido-completo", {
        // Dados da pizza
        sabores: saboresArray,
        tamanho: tamanho || 'Não selecionado',
        borda: borda || 'Sem Borda',
        adicionais: adicionaisArray,
        totalPizza: totalPizza || '0.00',
        
        // Dados das bebidas
        bebidas: bebidasPedido,
        totalBebidas: totalBebidas || '0.00',
        
        // Total geral
        totalGeral: totalGeral || '0.00'
    });
});
app.listen(port, () => {
    console.log(`🚀 Pizzaria MucaRoela rodando em http://localhost:${port}`);
});