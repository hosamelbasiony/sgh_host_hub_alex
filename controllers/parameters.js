module.exports = (connection) => {

    let controller =  {

        testById: async (req, res) => {

            const test = await connection.models.test.findOne(
                { testID: req.params.id }
            );
                
            res.status(200).json( test );
        },

        schedules: async (req, res) => {

            const runs = await connection.models.run.findAll();
            
            const shifts = await connection.models.shift.findAll();
                
            res.status(200).json( { runs, shifts } );
        },

        schedulesExtended: async (req, res) => {

            const runs = await connection.models.run.findAll();
            
            const shifts = await connection.models.shift.findAll();

            const tests = await connection.models.test.findAll();
                
            res.status(200).json( { runs, shifts, tests } );
        },

    };

    return controller;

};