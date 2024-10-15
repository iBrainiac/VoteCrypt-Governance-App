//SPDX-Licence-Identifier:MIT
pragma solidity ^0.8.26;

contract USElection{
    struct Candidate{
        string name;
        string description;
        uint256 voteCount;
    }
    mapping(uint256 => Candidate) public candidates;
    mapping(address => bool) public hasVoted;
    uint256 public candidatesCount;

    constructor(){
        candidatesCount = 0;
    }

    function addCandidate(string memory _name, string memory _description) public{
        candidatesCount ++;
        candidates[candidatesCount] = Candidate({
            name: _name,
            description: _description,
            voteCount: 0
        });
    }

    function vote(uint256 _candidateID) public{
        require(!hasVoted[msg.sender], " You can only vote once");
        require(_candidateID > 0 && _candidateID <= candidatesCount);
        candidates[_candidateID].voteCount ++;
        hasVoted[msg.sender] = true;
    }
    function getWinner() public view returns (string memory winnerName, uint256 totalVotes){
        require(candidatesCount > 0, "You cannot vote for a candidate, if no one is a candidate"  );


        uint256 highestVotes;
        uint256 winningID;

        for (uint256 i = 1; i <= candidatesCount; i ++){
            if (candidates[i].voteCount > highestVotes){
                highestVotes = candidates[i].voteCount;
                winningID = i;

            }
         }

         winnerName = candidates[winningID].name;
         totalVotes = candidates[winningID].voteCount;
    } 
}
