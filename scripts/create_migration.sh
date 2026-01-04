
name=$1

if [ -z "$name" ]; then
    echo "Error: name cannot be empty!"
    exit 1
fi

npx sequelize-mig migration:make -n "$name"
