# mepn wip
A mapping exercise.

To get the starter map working:
1. Create a folder where you want to run the app from.
2. Then, from a new Terminal window, type `cd path/to/your/folder`.
3. Then enter `git clone git@github.com:tbushman/mepn.git .`
4. Then enter `npm install`
5. Then create a file named `.env` with one line: `GOOGLE_KEY=google_maps_api_key` in the project root.
6. In a second Terminal window, type `cd path/to/your/folder`
7. From this second Terminal window, type `mongod --dbpath mepndb/db`
8. If you see the message, 'waiting for connections on port 27017', proceed. If not, you may have other MongoDB processes running.
9. In a third Terminal window, type `cd path/to/your/folder`
10. From this third Terminal window, type `mongo`
11. If all goes well, you can go back to the first Terminal window and enter `npm start`
