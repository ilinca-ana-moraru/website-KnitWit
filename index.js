const express = require("express");
const fs= require('fs');
const path = require('path');
const sharp = require('sharp');
const sass=require('sass');
const ejs=require('ejs');

// var client= new Client({database:"db_test",
//         user:"irina",
//         password:"irina",
//         host:"localhost",
//         port:5432});
// client.connect();
// client.query("select * from lab8_16", function(err, rez){
//     console.log("eroare:", err);
//     console.log("rezultat:", rez);
// })



obGlobal={
    obErori:null,
    obImagini:null,
    folderScss: path.join(__dirname,"resurse/scss"),
    folderCss: path.join(__dirname,"resurse/css"),
    folderBackup: path.join(__dirname,"backup")
}

app= express();
console.log("Folder proiect", __dirname);
console.log("Cale fisier", __filename);
console.log("Director de lucru", process.cwd());

vectorFoldere=["temp","temp1","backup"]
for(let folder of vectorFoldere){
    // let caleFolder=path.join(__dirname,folder)
    let caleFolder=__dirname+"/"+folder
    if(!fs.existsSync(caleFolder))
        fs.mkdirSync(caleFolder);
}

function compileazaScss(caleScss, caleCss){
    if(!caleCss){
        let vectorCale=caleScss.split("\\");
        let numeFisExt=vectorCale[vectorCale.length-1];
        let numeFis=numeFisExt.split(".")[0];
        caleCss=numeFis+".css";
    }
    if(!path.isAbsolute(caleScss))
        caleScss=path.join(obGlobal.folderScss,caleScss)
    if(!path.isAbsolute(caleCss))
        caleCss=path.join(obGlobal.folderCss,caleCss)
        //la acesr punct avem cai absolute in caleScss si caleCss

    let vectorCale=caleCss.split("\\");
    let numeFisCss=vectorCale[vectorCale.length-1];
    
    if(fs.existsSync(caleCss)){
        fs.copyFileSync(caleCss,path.join(obGlobal.folderBackup,numeFisCss))
    }
    rez=sass.compile(caleScss,{"sourceMap":true});
    fs.writeFileSync(caleCss,rez.css);
    console.log("Compilare SCSS",rez);
    
}

//compileazaScss("a.scss");

vFisiere=fs.readdirSync(obGlobal.folderScss)
for(let numeFis of vFisiere){
    if(path.extname(numeFis)==".scss"){
        compileazaScss(numeFis);
    }
}



fs.watch(obGlobal.folderScss,function(eveniment, numeFis){
    console.log(eveniment, numeFis);
    if(eveniment=="change" || eveniment=="rename"){
        let caleCompleta=path.join(obGlobal.folderScss, numeFis);
        if(fs.existsSync(caleCompleta)){
            compileazaScss(caleCompleta);
        }
    }
})


app.set("view engine","ejs");

app.use("/resurse", express.static(__dirname+"/resurse"));
app.use("/node_modules", express.static(__dirname+"/node_modules"));


app.use(/^\/resurse(\/[a-zA-Z0-9]*(?!\.)[a-zA-Z0-9]*)*$/, function(req,res){
    afisareEroare(res,403);
});

app.get("/ceva", function(req, res){
    console.log("cale:",req.url)
    res.send("<h1>altceva</h1> ip:"+req.ip);
})

app.get("/favicon.ico", function(req,res){
    res.sendFile(__dirname+"/resurse/imagini/ico/favicon.ico");
})


app.get(["/index","/","/home" ], function(req, res){
    res.render("pagini/index" , {ip: req.ip, a: 10, b:20, imagini:obGlobal.obImagini.imagini});
})

app.get("/*.ejs",function(req,res){
    afisareEroare(res,400);
})

app.get("*/galerie-animata.css",function(req, res){

    var sirScss=fs.readFileSync(__dirname+"/resurse/scss_ejs/galerie_animata.scss").toString("utf8");
    var culori=["navy","black","purple","grey"];
    var indiceAleator=Math.floor(Math.random()*culori.length);
    var culoareAleatoare=culori[indiceAleator]; 
    rezScss=ejs.render(sirScss,{culoare:culoareAleatoare});
    console.log(rezScss);
    var caleScss=__dirname+"/temp/galerie_animata.scss"
    fs.writeFileSync(caleScss,rezScss);
    try {
        rezCompilare=sass.compile(caleScss,{sourceMap:true});
        
        var caleCss=__dirname+"/temp/galerie_animata.css";
        fs.writeFileSync(caleCss,rezCompilare.css);
        res.setHeader("Content-Type","text/css");
        res.sendFile(caleCss);
    }
    catch (err){
        console.log(err);
        res.send("Eroare");
    }
});

app.get("*/galerie-animata.css.map",function(req, res){
    res.sendFile(path.join(__dirname,"temp/galerie-animata.css.map"));
});


app.get("/produse",function(req, res){


    //TO DO query pentru a selecta toate produsele
    //TO DO se adauaga filtrarea dupa tipul produsului
    //TO DO se selecteaza si toate valorile din enum-ul categ_prajitura
        if(req.query.tip)
            conditieWhere=` where tip_produs='${req.query.tip}'`
        client.query("select * from prajituri"+conditieWhere , function( err, rez){
            console.log(300)
            if(err){
                console.log(err);
                afisareEroare(res, 2);
            }
            else
                res.render("pagini/produse", {produse:rez.rows, optiuni:[]});
        });


});


app.get("/produs/:id",function(req, res){
    console.log(req.params);
   
    client.query(`select * from prajituri where id=${req.params.id}`, function( err, rezultat){
        if(err){
            console.log(err);
            afisareEroare(res, 2);
        }
        else
            res.render("pagini/produs", {prod:prezultat.rows[0]});
    });
});



app.get("/*",function(req, res){
    try{
        res.render("pagini"+req.url, function(err, rezRandare){
            if(err){

                console.log(err);
                console.log("ceva",err.message);
                if(err.message.startsWith("Failed to lookup view"))
                //afisareEroare(res,{_identificator:404, _titlu:"ceva"});
                    afisareEroare(res,404, "ceva");
                else
                    afisareEroare(res);
            }
            else{
                console.log(rezRandare);
                res.send(rezRandare);
            }
        } );
    }

    catch(err){
        console.log(err);
        if(err.message.startsWith("Cannot find module")){
            afisareEroare(res,404,"Fisier resursa negasit");
        }
    }
})
 

function initErori(){
    var continut= fs.readFileSync(__dirname+"/resurse/json/erori.json").toString("utf-8");
   
    obGlobal.obErori=JSON.parse(continut);
    let vErori=obGlobal.obErori.info_erori;
    //for (let i=0; i< vErori.length; i++ )
    for (let eroare of vErori){
        eroare.imagine="/"+obGlobal.obErori.cale_baza+"/"+eroare.imagine;
    }
}
initErori();



function initImagini(){
    var continut= fs.readFileSync(__dirname+"/resurse/json/galerie_statica.json").toString("utf-8");
   
    obGlobal.obImagini=JSON.parse(continut);

    let caleAbs=path.join(__dirname, obGlobal.obImagini.cale_galerie);
    let caleMediu=path.join(caleAbs,"mediu");
    let caleMic=path.join(caleAbs,"mic"); //folder in care vom crea imaginile de dim medie
    if(!fs.existsSync(caleMediu))
        fs.mkdirSync(caleMediu);
    if(!fs.existsSync(caleMic))
        fs.mkdirSync(caleMic);
    let vImagini=obGlobal.obImagini.imagini;
    for (let imag of vImagini){
        [numeFis, ext]=imag.cale_fisier.split(".");

        let caleAbsFisier=path.join(caleAbs,imag.cale_fisier);
        let caleAbsFisierMediu=path.join(caleMediu,numeFis+".webp");
        let caleAbsFisierMic=path.join(caleMic,numeFis+".webp");

        sharp(caleAbsFisier).resize(400).toFile(caleAbsFisierMediu);
        sharp(caleAbsFisier).resize(200).toFile(caleAbsFisierMic);

        imag.fisier="/"+path.join(obGlobal.obImagini.cale_galerie,imag.cale_fisier);
        imag.fisier_mediu="/"+path.join(obGlobal.obImagini.cale_galerie,"mediu",numeFis+".webp");
        imag.fisier_mic="/"+path.join(obGlobal.obImagini.cale_galerie,"mic",numeFis+".webp");



    }
}
initImagini();

/*
daca  programatorul seteaza titlul, se ia titlul din argument
daca nu e setat, se ia cel din json
daca nu avem titluk nici in JSOn se ia titlul de valoarea default
idem pentru celelalte
*/

//function afisareEroare(res, {_identificator, _titlu, _text, _imagine}={} ){
function afisareEroare(res, _identificator, _titlu="titlu default", _text, _imagine ){
    let vErori=obGlobal.obErori.info_erori;
    let eroare=vErori.find(function(elem) {return elem.identificator==_identificator;} )
    if(eroare){
        let titlu1= _titlu=="titlu default" ? (eroare.titlu || _titlu) : _titlu;
        let text1= _text || eroare.text;
        let imagine1= _imagine || eroare.imagine;
        if(eroare.status)
            res.status(eroare.identificator).render("pagini/eroare", {titlu:titlu1, text:text1, imagine:imagine1});
        else
            res.render("pagini/eroare", {titlu:titlu1, text:text1, imagine:imagine1});
    }
    else{
        let errDef=obGlobal.obErori.eroare_default;
        res.render("pagini/eroare", {titlu:errDef.titlu, text:errDef.text, imagine:obGlobal.obErori.cale_baza+"/"+errDef.imagine});
    }
    

}


app.listen(8080);
console.log("Serverul a pornit");