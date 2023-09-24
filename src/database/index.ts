import { join } from 'path';
import { DataSource } from "typeorm"

const AppDataSource = new DataSource({
    type: 'postgres',
    username: 'postgres',
    password: 'password',
    host: 'localhost',
    port: 5432,
    database: 'rolox',
    synchronize: true,
    logging: false,
    entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
    migrations: [join(__dirname, '../**/*.migration{.ts,.js}')],
    subscribers: [join(__dirname, '../**/*.subscriber{.ts,.js}')],
})

export default AppDataSource;