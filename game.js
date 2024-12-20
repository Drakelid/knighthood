// Player stats
const player = {
    level: 1,
    hp: 100,
    maxHp: 100,
    baseAttack: 10,
    attackVariation: 2, // damage will be baseAttack ± attackVariation
    xp: 0,
    xpToNextLevel: 50,
    gold: 0,
    potions: 0,
    specialAttackCooldown: 0 // turns until next special attack
};

let monsters = [];
let currentMonsterIndex = 0;
let currentMonster = null;

// Game initialization
document.addEventListener('DOMContentLoaded', () => {
    fetch('monsters.json')
        .then(res => res.json())
        .then(data => {
            monsters = data.monsters;
            startGame();
        })
        .catch(err => console.error("Failed to load monsters:", err));
});

function startGame() {
    currentMonsterIndex = 0;
    loadMonster();
    updateUI();
}

function loadMonster() {
    if (currentMonsterIndex < monsters.length) {
        currentMonster = { ...monsters[currentMonsterIndex] }; // clone monster
    } else {
        currentMonster = null;
    }
    updateUI();
}

function updateUI() {
    document.getElementById('player-level').textContent = player.level;
    document.getElementById('player-hp').textContent = player.hp;
    document.getElementById('player-max-hp').textContent = player.maxHp;
    document.getElementById('player-xp').textContent = player.xp;
    document.getElementById('xp-to-level').textContent = player.xpToNextLevel;
    document.getElementById('player-gold').textContent = player.gold;
    document.getElementById('player-potions').textContent = player.potions;

    if (currentMonster) {
        document.getElementById('monster-name').textContent = currentMonster.name;
        document.getElementById('monster-hp').textContent = currentMonster.hp;
        document.getElementById('monster-image').src = currentMonster.image;
    } else {
        document.getElementById('monster-name').textContent = "No more monsters!";
        document.getElementById('monster-hp').textContent = "-";
        document.getElementById('monster-image').src = "";
    }

    document.getElementById('message').textContent = '';
}

function getRandomDamage(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Player Attack Function
function playerAttack() {
    const damage = getRandomDamage(player.baseAttack - player.attackVariation, player.baseAttack + player.attackVariation);
    currentMonster.hp -= damage;
    return damage;
}

// Player Special Attack Function (Higher damage, needs cooldown)
function playerSpecialAttack() {
    if (player.specialAttackCooldown > 0) {
        document.getElementById('message').textContent = "Special attack is on cooldown!";
        return null;
    }
    const damage = getRandomDamage(player.baseAttack * 2 - player.attackVariation, player.baseAttack * 2 + player.attackVariation);
    currentMonster.hp -= damage;
    player.specialAttackCooldown = 3; // after use, 3 turns cooldown
    return damage;
}

// Monster Attack Function
function monsterAttack() {
    // Regular attack
    let damage = getRandomDamage(currentMonster.attackMin, currentMonster.attackMax);

    // Chance for special attack (extra damage)
    if (Math.random() < currentMonster.specialChance) {
        damage += Math.floor(damage * 0.5); // 50% more damage on special
    }

    player.hp -= damage;
    return damage;
}

// When monster is defeated
function monsterDefeated() {
    document.getElementById('message').textContent = `You defeated the ${currentMonster.name}! Gained ${currentMonster.xp} XP and ${currentMonster.gold} gold.`;
    player.xp += currentMonster.xp;
    player.gold += currentMonster.gold;
    checkLevelUp();

    currentMonsterIndex++;
    if (currentMonsterIndex < monsters.length) {
        loadMonster();
    } else {
        currentMonster = null;
        updateUI();
        document.getElementById('message').textContent = "All monsters are defeated! You are victorious!";
    }
}

// Check if player levels up
function checkLevelUp() {
    while (player.xp >= player.xpToNextLevel) {
        player.xp -= player.xpToNextLevel;
        player.level++;
        player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.5);
        // Increase player stats on level up
        player.maxHp += 20;
        player.hp = player.maxHp; // full heal on level up
        player.baseAttack += 2;
        document.getElementById('message').textContent += " You leveled up!";
    }
}

// When player is defeated
function playerDefeated() {
    player.hp = 0;
    updateUI();
    document.getElementById('message').textContent = `You were defeated by the ${currentMonster.name}. Game Over.`;
}

// Use Potion
function usePotion() {
    if (player.potions > 0) {
        const healAmount = 30;
        player.hp = Math.min(player.hp + healAmount, player.maxHp);
        player.potions--;
        document.getElementById('message').textContent = `You used a potion and restored ${healAmount} HP!`;
        updateUI();
    } else {
        document.getElementById('message').textContent = "You have no potions!";
    }
}

// Buy Potion (cost 10 gold)
function buyPotion() {
    if (player.gold >= 10) {
        player.gold -= 10;
        player.potions++;
        document.getElementById('message').textContent = "You bought a potion!";
        updateUI();
    } else {
        document.getElementById('message').textContent = "Not enough gold!";
    }
}

// Attempt to run from the monster
function runAway() {
    if (!currentMonster) return;
    const success = Math.random() < 0.5; // 50% chance
    if (success) {
        document.getElementById('message').textContent = `You ran away from the ${currentMonster.name}!`;
        currentMonsterIndex++;
        if (currentMonsterIndex < monsters.length) {
            loadMonster();
        } else {
            document.getElementById('message').textContent = "No more monsters remain.";
            currentMonster = null;
            updateUI();
        }
    } else {
        const damage = monsterAttack();
        updateUI();
        document.getElementById('message').textContent = `You failed to run away. The ${currentMonster.name} hit you for ${damage} damage!`;
        if (player.hp <= 0) {
            playerDefeated();
        }
    }
}

// Handle Attack button
document.getElementById('attack-btn').addEventListener('click', () => {
    if (!currentMonster) return;

    const playerDamage = playerAttack();
    if (currentMonster.hp <= 0) {
        monsterDefeated();
        return;
    }

    const monsterDamage = monsterAttack();
    if (player.hp <= 0) {
        playerDefeated();
        return;
    }

    if (player.specialAttackCooldown > 0) {
        player.specialAttackCooldown--;
    }

    updateUI();
    document.getElementById('message').textContent = `You dealt ${playerDamage} damage. The ${currentMonster.name} hit you for ${monsterDamage} damage!`;
});

// Handle Special Attack
document.getElementById('special-attack-btn').addEventListener('click', () => {
    if (!currentMonster) return;

    const playerDamage = playerSpecialAttack();
    if (playerDamage === null) return; // cooldown active

    if (currentMonster.hp <= 0) {
        monsterDefeated();
        return;
    }

    const monsterDamage = monsterAttack();
    if (player.hp <= 0) {
        playerDefeated();
        return;
    }

    updateUI();
    document.getElementById('message').textContent = `You performed a special attack dealing ${playerDamage} damage! The ${currentMonster.name} hit you back for ${monsterDamage} damage!`;
});

// Handle Use Potion
document.getElementById('use-potion-btn').addEventListener('click', usePotion);

// Handle Buy Potion
document.getElementById('buy-potion-btn').addEventListener('click', buyPotion);

// Handle Run
document.getElementById('run-btn').addEventListener('click', runAway);
