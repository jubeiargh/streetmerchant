if [ "$(docker ps -aq -f status=exited -f name=streetmerchant)" ]; then
    # cleanup
    docker start streetmerchant
fi






# start streetmerchant 
0 7 * * 1-5 docker run streetmerchant

# stop streetmerchant
0 19 * * 1-5 docker stop streetmerchant

# restart streetmerchant
1-59/2 7-18 * * 1-5 bash /home/user/docker_restarter.sh