let count = 0;

function found(element){

if(element.classList.contains("found")){
return;
}

element.classList.add("found");

count++;

document.getElementById("counter").innerText = count;

if(count === 5){
document.getElementById("message").innerText =
"Bravo ! Vous avez trouvé les 5 objets. Envoyez un screen à l'animateur.";
}

}