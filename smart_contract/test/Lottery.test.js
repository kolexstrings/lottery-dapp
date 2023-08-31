const ganache = require('ganache');
const { Web3 } = require('web3');
const assert = require('assert');
const mocha = require('mocha');

const web3 = new Web3(ganache.provider());
const {interface, bytecode} = require ('../compile');

let lottery;
let accounts;

beforeEach (async ()=> {
    accounts = await web3.eth.getAccounts();

    lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send ({ from: accounts[0], gas: '1000000'});
});

describe ('Lottery Contract', ()=> {
    it('it deploys a contract', ()=> {
        assert.ok(lottery.options.address)
    })
    //Testing to see if one account is allowed to enter into the lottery
    it('it allows one account to enter', async ()=> {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.2', 'ether')
        });

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0],
        }) 

        assert.equal(accounts[0],players[0]);
        assert.equal(1, players.length);
    })

    // Testing to make sure that multiple players are allowed to enter into the lottery
    it('it allows multiple accounts to enter the lottery', async ()=> {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.2', 'ether')
        });

        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei('0.2', 'ether')
        });

        await lottery.methods.enter().send({
            from: accounts[2],
            value: web3.utils.toWei('0.2', 'ether')
        })

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        })

        assert.equal(accounts[0], players[0]);
        assert.equal(accounts[1], players[1]);
        assert.equal(accounts[2], players[2]);
        assert.equal(3, players.length);

    });

    //  Testing to ensure that the required minimum amount to enter the lottery is adhered to
    it('requires a minimum amount of ether to enter', async ()=> {
        try {
            await lottery.methods.enter().send({
                from: accounts[0],
                value: 2
            });
            assert(false)
        }catch(error) {
            assert(error)
        };
    });
    //Testing to make sure no other account can call pickWinner else throw an error
    it('only manager can call pick winner', async ()=> {
        try {
            await lottery.methods.pickWinner().send({
                from: accounts[1]
            });
            assert(false);
        }catch(error) {
            assert(error);
        }
    })

    //Testing to see if manager can call pickWinner fucntion
    it('manager tried to call pickWinner', async ()=> {
        try{
            await lottery.methods.pickWinner().send({
                from: accounts[0]
            });
            assert(true)
        }catch(error){
            assert(error)
        }
    }); 

    it('It sends money to the winner and empty the players array (end to end testing)', async ()=> {
        await lottery.methods.enter().send({
            from: accounts[0], 
            value: web3.utils.toWei('20', 'ether')
        })

        const initialBalance = await web3.eth.getBalance(accounts[0]);

        await lottery.methods.pickWinner().send({
            from: accounts[0]
        })

        const finalBalance = await web3.eth.getBalance(accounts[0]);

        const difference = finalBalance - initialBalance

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        })

        console.log("Player array:", players)

        console.log("Initial balance:", initialBalance);
        console.log("Final balance:", finalBalance);

        console.log("Difference:", difference);

        assert(difference > web3.utils.toWei('1.8', 'ether'))
        //check that the players array has been succesfully reset to empty after the pickWinner function has been called
        const lotteryAddress = await lottery.options.address

        console.log("Lottery address:", lotteryAddress);

        const lotteryBalance = await web3.eth.getBalance(lotteryAddress)

        console.log("Lottery contract balance: ", lotteryBalance)

        assert.equal(0, players.length);
        assert.equal(0, lotteryBalance);
    })
    
});
